# U1 Chat Core — NFR Design Patterns

| Pattern | Applied To | Realizes |
|---|---|---|
| **Idempotent Create** (conditional `attribute_not_exists(PK)`) | Channel META creation | NFR-R1, BR-2, US-1 (safe stream retries) |
| **Idempotent Consumer / Dedup Guard** (`TransactWriteItems`: message + `DEDUP#<clientMessageId>`) | Message send | NFR-R1, BR-6, US-6 (exactly-once offline delivery) |
| **Optimistic State Transition** (conditional update `status == OPEN`) | Channel lock | BR-3 (no double-lock; LOCKED terminal) |
| **Fixed-Window Rate Limiter** (atomic `ADD`, short TTL) | Send throttling | NFR-S2, BR-7, SECURITY-11 |
| **CQRS-lite Read Model** (denormalized membership items, GSI1 recency) | Inbox listing | NFR-P2, US-9 (efficient recency query, no scans) |
| **Derived Read (no stored counter)** (count since `lastReadAt`) | Unread count | BR-9, PBT-03 (no drift / negative count) |
| **Self-Healing Registry** (delete connection on `GoneException` + TTL) | Connection store | NFR-R3, BR-13 |
| **Ports & Adapters (Hexagonal)** | Whole unit | NFR-M1 (AWS-agnostic, testable) |
| **Error Taxonomy + Fail-Closed** | All operations | NFR-R2, SECURITY-15 |
| **Input Validation Gate** (allowlist ids, bounded body) | Service entry | NFR-SEC1, SECURITY-05 |
| **Log Redaction** (structured logs, no PII/body/token) | All services | NFR-SEC4, SECURITY-03 |
| **TTL-based Retention** (numeric `ttl` per entity) | All chat items | NFR-2 (90d / 2h / 2m) |

## Error Taxonomy (typed, fail-closed)
| Domain error | Maps to | When |
|---|---|---|
| `ChatNotFoundError` | 404 | channel/message absent |
| `ChatForbiddenError` | 403 | non-participant / unauth (SECURITY-08) |
| `ChatConflictError` | 409 | send on LOCKED channel |
| `ChatValidationError` | 400 | body/id validation fails (SECURITY-05) |
| `ChatThrottlingError` | 429 | rate limit exceeded (reuse repo `ThrottlingError` shape) |
- All persistence calls wrapped; on unexpected error → fail closed (deny), log with correlation id,
  return generic message. Global handler at each adapter entry (added in U2/U3 handlers).

## Concurrency & Consistency
- **Channel create race**: two concurrent ACCEPTED events → conditional create makes the second a
  no-op returning the existing channel.
- **Message ordering**: server `sentAt` (ISO-8601) + ULID `messageId` in SK; reverse scan = newest.
- **lastReadAt monotonicity**: conditional/`max` update so out-of-order markRead cannot decrease it.
- **Consistency level**: eventual reads acceptable for history/inbox; idempotency covers retries.

## Security Pattern Mapping
- SECURITY-05 → Input Validation Gate. SECURITY-08 → participant authz in every service method.
- SECURITY-11 → Fixed-Window Rate Limiter + isolated authz module. SECURITY-15 → Error Taxonomy +
  Fail-Closed. SECURITY-03 → Log Redaction. SECURITY-01 → TTL/encryption (table-level, verified in
  Infra Design). SECURITY-06/02/14 → U6.
