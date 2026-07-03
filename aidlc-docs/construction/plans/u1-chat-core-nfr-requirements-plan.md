# U1 Chat Core — NFR Requirements Plan

> Answers pre-filled with recommendations per the user's standing instruction. Most stack choices
> are constrained by the existing repo; this stage records them and the PBT framework (PBT-09).

### Q-1 — Expected load (sizing)
[Answer]: Low-to-moderate. Chat volume is bounded by active accepted donations; assume < 10 msg/s
aggregate near-term, well within DynamoDB on-demand. Rate limit caps per-channel writes (60/min).

### Q-2 — Latency target
[Answer]: Domain logic p99 < 50 ms (excluding network/DynamoDB); end-to-end realtime delivery
target < 1 s for connected clients.

### Q-3 — ID generation
A) Add `uuid`
B) Reuse existing `generateUniqueID()` (ulid) from `core/application/utils/idGenerator.ts`
[Answer]: B — ULID is sortable and already used across the repo; `messageId = generateUniqueID()`.

### Q-4 — PBT framework (PBT-09)
[Answer]: **fast-check** (Jest-compatible) — add as a devDependency; not currently present.

### Q-5 — DynamoDB access layer
[Answer]: Reuse the existing `DynamoDbTableOperations` base + `@aws-sdk/client-dynamodb` (already a
dep); new chat models extend it (no new persistence framework).

### Q-6 — Availability / consistency
[Answer]: DynamoDB on-demand (multi-AZ); strongly-consistent reads not required for chat (eventual
is acceptable for history/inbox); idempotent create + dedup cover retries.

## Checklist
- [x] nfr-requirements.md
- [x] tech-stack-decisions.md (incl. fast-check selection — PBT-09)
