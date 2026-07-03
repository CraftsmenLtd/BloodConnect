# U6 Infrastructure & Integration — Wiring / Deployment Rules

| ID | Rule | Trace |
|---|---|---|
| **BR-U6-1** | Each chat Lambda gets a dedicated least-privilege IAM `statement` — no wildcards beyond the required `@connections/*` resource path. | SECURITY-06 |
| **BR-U6-2** | The WebSocket stage enables access + execution logging with `data_trace_enabled = false` (no message payloads in logs); log retention ≥ 90 days. | SECURITY-02/03/14 |
| **BR-U6-3** | The DynamoDB stream mapping uses `filter_criteria` (SK prefix `ACCEPTED#`/`BLOOD_REQ#`), `ReportBatchItemFailures`, `bisect_batch_on_function_error`, `starting_position = LATEST`. | NFR-U2-R2 |
| **BR-U6-4** | `chat-send-message` is the only chat Lambda with `sqs:SendMessage`; only message-posting Lambdas get `execute-api:ManageConnections`. | SECURITY-06 |
| **BR-U6-5** | REST chat Lambdas (`get-history`, `list-channels`) are **read-only** on DynamoDB. | SECURITY-06 |
| **BR-U6-6** | All transport is TLS (WSS / HTTPS); the shared table is encrypted at rest (default). | SECURITY-01 |
| **BR-U6-7** | The chat module is **additive** — instantiated from the root `modules.tf`; removing it disables chat with no data migration (chat data is TTL'd). | rollback |
| **BR-U6-8** | OpenAPI paths are registered in `openapi/versions/v1.json`; the bundle must pass Redocly + Spectral. | FR-4 (document getHistory) |
| **BR-U6-9** | Same module deploys to LocalStack; documented caveats where a LocalStack edition lacks a feature (e.g., WS authorizer). | NFR-6 (LocalStack) |

## No Testable Properties (PBT) at the infra layer
- U6 produces IaC, not business logic — **PBT N/A**. Verification is `terraform validate` + Spectral
  lint + LocalStack/AWS integration (Build & Test).

## Security compliance (consolidated, this unit)
- SECURITY-01 ✅ (TLS + at-rest), -02 ✅ (API logging), -06 ✅ (least-privilege IAM matrix),
  -14 ✅ (≥90d retention). -03 ✅ (no payloads in logs). Others (-05/-08/-15) enforced in the
  application units; U6 does not weaken them.
