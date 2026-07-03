# U2 Channel Lifecycle — NFR Requirements Plan

> Answers pre-filled with recommendations per the user's standing instruction.

### Q-1 — Load / throughput
[Answer]: Bounded by donation acceptances/completions — low volume. Stream batch (configurable, default
10). Per-record work: create = 1 request read + 1 transactional write; lock = 1 acceptance query +
N (small) channel updates.

### Q-2 — Latency
[Answer]: Asynchronous (not user-facing). Target end-to-end channel availability within a few seconds
of acceptance.

### Q-3 — Reliability / retries
[Answer]: Partial-batch-failure (`ReportBatchItemFailures`) with idempotent create + conditional lock,
so retries are safe. Stream retains records for replay.

### Q-4 — Tech stack (no new deps)
[Answer]: `aws-lambda` types (`DynamoDBStreamEvent`, `DynamoDBBatchResponse`) and
`@aws-sdk/util-dynamodb` `unmarshall` — both already available. Reuse U1 `ChatChannelService`,
existing `BloodDonationService` / `AcceptDonationService`, logger/config. PBT: fast-check (from U1).

### Q-5 — Security
[Answer]: Least-privilege IAM (stream read on the table stream ARN + `dynamodb:GetItem`/`Query`/
`UpdateItem`/`TransactWriteItems` on table+GSI1) — authored in U2 Infra Design / U6. No PII in logs.

## Checklist
- [x] nfr-requirements.md
- [x] tech-stack-decisions.md
