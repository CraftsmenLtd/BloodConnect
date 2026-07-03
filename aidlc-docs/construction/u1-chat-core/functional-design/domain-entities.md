# U1 Chat Core — Domain Entities & DynamoDB Schema

> Single table (shared), keys prefixed per entity. Follows the as-built conventions in
> `docs/architecture/Database.rst` and the `NosqlModel` + `DbModelDtoAdapter` framework
> (`getIndexDefinitions`/`fromDto`/`toDto`). Indexed attrs are strings. `ttl` is numeric epoch
> seconds (DynamoDB TTL).

## 1. ChatChannelDTO (META item = status source of truth)
**Fields**: `channelId` (`<requestPostId>#<donorId>`), `seekerId`, `requestPostId`, `donorId`,
`status` (`OPEN | LOCKED`), `context` (`{ requestedBloodGroup, urgencyLevel, donationDateTime, location }`),
`lastMessageAt?`, `lastMessagePreview?`, `createdAt`, `ttl`.

| Key | Value |
|---|---|
| `PK` | `CHAT_CHANNEL#<channelId>` |
| `SK` | `META` |

- Created idempotently (conditional `attribute_not_exists(PK)`).
- `context` is an immutable snapshot captured at creation (survives acceptance-row deletion on IGNORED).

## 2. Channel Membership item (inbox index + per-user read state)
One per participant (seeker + donor). Denormalized view for the inbox; **not** the status source.

**Fields**: `userId`, `channelId`, `otherParticipantId`, `role` (`SEEKER | DONOR`),
`context` (snapshot, for `ChatRoomHeader`), `lastMessageAt?`, `lastMessagePreview?`, `lastReadAt?`,
`createdAt`, `ttl`.

| Key | Value |
|---|---|
| `PK` | `CHAT_USER#<userId>` |
| `SK` | `CHANNEL#<channelId>` |
| `GSI1PK` | `CHAT_USER#<userId>` |
| `GSI1SK` | `<lastMessageAt|createdAt>#<channelId>` |

- **Inbox query**: `GSI1` where `GSI1PK = CHAT_USER#<userId>`, `ScanIndexForward=false`
  → channels recency-sorted (US-9).
- **Direct get** of a user's membership for a channel: `PK = CHAT_USER#<userId>`,
  `SK = CHANNEL#<channelId>` (read state, role).
- On each new message, both membership items update `lastMessageAt`/`lastMessagePreview`
  (and thus `GSI1SK`).

## 3. ChatMessageDTO
**Fields**: `channelId`, `messageId` (ULID), `clientMessageId`, `senderId`, `body` (Unicode/emoji),
`sentAt` (ISO-8601), `ttl`.

| Key | Value |
|---|---|
| `PK` | `CHAT_MSG#<channelId>` |
| `SK` | `MSG#<sentAt>#<messageId>` |

- **History query**: `PK = CHAT_MSG#<channelId>`, `SK begins_with MSG#`, `ScanIndexForward=false`,
  `Limit=20`, cursor via `LastEvaluatedKey` (US-5).

## 4. Message Dedup Guard item (idempotency)
Written atomically with the message via `TransactWriteItems`.

| Key | Value |
|---|---|
| `PK` | `CHAT_MSG#<channelId>` |
| `SK` | `DEDUP#<clientMessageId>` |

- Condition `attribute_not_exists(PK)` on this item ⇒ duplicate send fails the transaction ⇒
  return the existing message (PBT-04 idempotence). Carries `ttl` (90d).

## 5. ChatConnectionDTO
**Fields**: `connectionId`, `userId`, `connectedAt`, `ttl` (~2h).

| Key | Value |
|---|---|
| `PK` | `CHAT_CONN#<connectionId>` |
| `SK` | `META` |
| `GSI1PK` | `CHAT_CONN_USER#<userId>` |
| `GSI1SK` | `<connectionId>` |

- **Disconnect**: direct delete on `PK = CHAT_CONN#<connectionId>`, `SK = META`.
- **List a user's connections** (for delivery): `GSI1` where `GSI1PK = CHAT_CONN_USER#<userId>`.

## 6. Rate-Limit Counter item
| Key | Value |
|---|---|
| `PK` | `CHAT_RATE#<channelId>#<senderId>` |
| `SK` | `MIN#<yyyy-mm-ddThh:mm>` |

- Atomic `ADD count 1` per send; throttle when `count > 60`; `ttl` ~120s (fixed 1-min window).

## Relationships
```
ChatChannel(META) 1 --- 2 ChannelMembership (seeker, donor)
ChatChannel 1 --- * ChatMessage   (PK = CHAT_MSG#<channelId>)
ChatMessage 1 --- 1 DedupGuard     (per clientMessageId)
User 1 --- * ChatConnection
(channel,sender) 1 --- * RateCounter (per minute bucket)
```

## Overloaded GSI1 additions (coexist with existing LOC#/REQ#/DONOR_SEARCH#/<requestPostId>)
| Entity | GSI1PK | GSI1SK |
|---|---|---|
| Channel Membership | `CHAT_USER#<userId>` | `<lastMessageAt>#<channelId>` |
| Chat Connection | `CHAT_CONN_USER#<userId>` | `<connectionId>` |

## Testable Properties (PBT-01)
- **Round-trip**: `fromDto`/`toDto` for ChatChannel, ChannelMembership, ChatMessage, ChatConnection;
  `channelId` build/parse (`<requestPostId>#<donorId>`); all key build/parse.
- **Invariant**: history newest-first; `ttl` always set and in the future; `body.length ≤ 2000`;
  `GSI1SK` timestamp segment is ISO-8601-sortable.
- **Idempotence**: dedup-guard makes repeated `(channelId, clientMessageId)` writes a no-op.
- **Stateful** (carried into services): channel `OPEN → LOCKED` only; unread ≥ 0 under command seqs.
