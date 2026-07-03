# U1 Chat Core — Functional Design Plan

> Answers pre-filled with recommendations per the user's standing instruction. Overridable at the
> review gate. This stage is technology-agnostic business logic + the **DynamoDB key schema**
> (the one infra-adjacent detail the unit owns, since downstream units depend on it).

## Design Decisions (recommended, pre-filled)

### Q-1 — Channel identity (channelId)
A) `channelId = <requestPostId>#<donorId>` (seeker implied by the request)
B) `channelId = <seekerId>#<requestPostId>#<donorId>`
X) Other

[Answer]: A — `requestPostId` is globally unique and owned by one seeker, so `<requestPostId>#<donorId>`
uniquely identifies the 1:1 channel; `seekerId`/`donorId`/`requestPostId` are stored as attributes.

### Q-2 — Inbox access pattern (list a user's channels, recency-sorted)
A) Scan/filter channels by participant
B) Per-participant **membership items** indexed on overloaded **GSI1**
   (`GSI1PK = CHAT_USER#<userId>`, `GSI1SK = <lastMessageAt>#<channelId>`)
X) Other

[Answer]: B — matches the repo's overloaded-GSI1 convention; gives an efficient recency-sorted inbox
query without scans. Two membership items per channel (seeker + donor); `META` item is the status
source of truth.

### Q-3 — Message ordering / pagination
A) SK = `MSG#<sentAt>#<messageId>`, query `ScanIndexForward=false` for newest-first (size 20)
B) Maintain a separate ordering index
X) Other

[Answer]: A — ISO-8601 `sentAt` sorts lexicographically; reverse scan = newest-first; cursor =
`LastEvaluatedKey`.

### Q-4 — Message idempotency (offline dedup by clientMessageId)
A) Best-effort (no guarantee)
B) Atomic `TransactWriteItems`: message item + a dedup-guard item
   (`SK = DEDUP#<clientMessageId>`, condition `attribute_not_exists`) — duplicate ⇒ return existing
X) Other

[Answer]: B — guarantees exactly-once per `(channelId, clientMessageId)` (PBT-04), mirroring the
conditional-put idempotency already used for notifications.

### Q-5 — Unread count
A) Maintain a stored counter (increment/decrement)
B) Derive: `countSince(channelId, lastReadAt)` excluding the user's own messages
X) Other

[Answer]: B — derivation avoids counter drift/negative-count bugs; the `unread ≥ 0` invariant holds
trivially (PBT-03).

### Q-6 — Rate-limit counter mechanism
A) Fixed 1-minute window counter (DynamoDB atomic ADD, ~120s TTL); throttle when >60
B) True sliding window (heavier)
X) Other

[Answer]: A — fixed 1-minute window bounds throughput to ~60/min (worst-case edge burst ~120),
satisfying the abuse-prevention intent (SECURITY-11/NFR-3) cheaply. Sliding-window noted as optional
hardening.

### Q-7 — TTL values
A) Channels & messages 90d; connections ~2h; rate counters ~2min
B) Single uniform TTL
X) Other

[Answer]: A — per requirements (90d retention) plus practical lifetimes for ephemeral connection /
rate-limit items.

## Execution Checklist
- [x] domain-entities.md (entities, fields, relationships, **DynamoDB key schema**)
- [x] business-logic-model.md (operations, data flow, algorithms)
- [x] business-rules.md (BR-1..BR-n, validation, constraints)
- [x] Testable Properties section per PBT-01 (round-trip / invariant / idempotence / stateful)
- [x] Security touchpoints noted (SECURITY-05/08/15 at the domain level)
