# U1 Chat Core — NFR Design Plan

> Answers pre-filled with recommendations per the user's standing instruction.

### Q-1 — Resilience pattern for retries
[Answer]: Idempotent-consumer pattern — conditional create (channel) + dedup-guard transaction
(message). Safe under at-least-once stream/WebSocket retries.

### Q-2 — State-transition safety
[Answer]: Optimistic conditional update (`status == OPEN`) for lock; LOCKED terminal. No locks/leases
needed.

### Q-3 — Rate-limit pattern
[Answer]: Fixed-window atomic counter (DynamoDB `ADD`) with short TTL; throttle on overflow.

### Q-4 — Read-model strategy (inbox/unread)
[Answer]: CQRS-lite — denormalized membership items as the inbox read model (recency via GSI1);
unread is **derived** (count-since-lastReadAt), not a stored counter (avoids drift).

### Q-5 — New logical infra components (queues/caches/circuit breakers)?
[Answer]: None new at U1 — reuse table + SDK. (WebSocket API, stream mapping, SQS push are U3/U4/U6.)

### Q-6 — Logging/redaction pattern
[Answer]: Structured logs via existing logger with **field redaction** — never log `body`, tokens,
or phone numbers; include correlation id (SECURITY-03).

## Checklist
- [x] nfr-design-patterns.md
- [x] logical-components.md
