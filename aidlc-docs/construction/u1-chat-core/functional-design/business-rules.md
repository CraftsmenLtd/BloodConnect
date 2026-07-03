# U1 Chat Core — Business Rules

| ID | Rule | Rationale / Trace |
|---|---|---|
| **BR-1** | `channelId = <requestPostId>#<donorId>`; exactly one channel per acceptance triplet `(seekerId, requestPostId, donorId)`. | Uniqueness; FR-1 |
| **BR-2** | Channel creation is **idempotent** — conditional `attribute_not_exists(PK)` on the META item; a duplicate stream event returns the existing channel, never a second one. | FR-1, US-1, PBT-04 |
| **BR-3** | Channel status transitions: `OPEN → LOCKED` only. `LOCKED` is terminal (no reopen). `IGNORED` causes **no** transition (channel stays `OPEN`). | FR-7, US-3, Q6=C |
| **BR-4** | A message is accepted only if the channel exists, `status == OPEN`, and `senderId ∈ {seekerId, donorId}`. | US-3, US-11, SECURITY-08 |
| **BR-5** | Message `body`: required, non-empty after trim, **≤ 2000** Unicode characters (emoji allowed); reject other content types and control characters except newline. | FR-3, US-4, SECURITY-05 |
| **BR-6** | Message delivery is **exactly-once per `(channelId, clientMessageId)`** via the dedup-guard transaction. | FR-6, US-6, PBT-04 |
| **BR-7** | Rate limit: **≤ 60 messages/minute per `(channelId, senderId)`** (fixed 1-minute window); exceeding throws `ThrottlingError`. | NFR-3, US-12, SECURITY-11 |
| **BR-8** | `lastReadAt` is **monotonic non-decreasing** per `(channelId, userId)`. | US-8 |
| **BR-9** | `unreadCount(channelId, userId) = count(messages where sentAt > lastReadAt AND senderId ≠ userId)`; always **≥ 0**. | US-9, PBT-03 |
| **BR-10** | TTL: channels, memberships, messages, dedup guards = **90 days**; connections ≈ **2h**; rate counters ≈ **2 min**. | NFR-2 |
| **BR-11** | `context` snapshot (blood group, urgency, donationDateTime, location) is captured at channel creation and is **immutable** thereafter (survives later acceptance-record deletion on IGNORED). | FR-1, FR-7 |
| **BR-12** | History is returned **newest-first**, page size 20, cursor-based. | FR-4, US-5 |
| **BR-13** | On `GoneException` posting to a connection, that connection record is deleted (self-healing connection registry). | NFR-4 |
| **BR-14** | All identifiers (`seekerId`, `donorId`, `requestPostId`, `connectionId`, `clientMessageId`) are validated as non-empty strings of bounded length before use in keys. | SECURITY-05 |

## Validation Functions
- `validateBody(body)`: trim; assert `1 ≤ length ≤ 2000`; assert no disallowed control chars; (emoji
  = valid Unicode, allowed).
- `validateIds({...})`: assert each id matches `^[A-Za-z0-9._:-]{1,128}$` (bounded; injection-safe key
  segments) — exact pattern finalized in code, but bounded + allowlisted (SECURITY-05).

## Security Rule Mapping (domain-level; full enforcement, blocking)
- **SECURITY-05**: BR-5, BR-14, validation functions.
- **SECURITY-08**: BR-4 (`assertParticipant`), participant-scoped reads/writes.
- **SECURITY-11**: BR-7 rate limit; chat-auth logic isolated in services.
- **SECURITY-15**: fail-closed error handling (see business-logic-model.md Error Handling).
- (SECURITY-01 encryption, -02 access logs, -06 IAM, -14 retention/alerts → enforced in NFR Design /
  Infrastructure Design / U6, not at this domain layer.)

## PBT Property Catalogue (PBT-01 → carried to Code Generation)
| Property | Category | Shape |
|---|---|---|
| DTO ↔ item round-trip (4 models) | Round-trip | `toDto(fromDto(x)) == x` |
| channelId build/parse | Round-trip | `parse(build(requestPostId, donorId)) == (requestPostId, donorId)` |
| History newest-first | Invariant | output ordered by `sentAt` desc |
| Unread ≥ 0 | Invariant | `getUnreadCount(...) >= 0` |
| Body length bound | Invariant | accepted ⟹ `1 ≤ len ≤ 2000` |
| Channel create idempotent | Idempotence | `create;create == create` |
| Message dedup | Idempotence | repeated `(channel, clientMessageId)` ⟹ one message |
| Channel state machine | Stateful | only `OPEN→LOCKED`; no send when `LOCKED` |
| Unread under send/markRead seq | Stateful | model vs system equivalence |
| `lastReadAt` monotonic | Invariant | never decreases |
