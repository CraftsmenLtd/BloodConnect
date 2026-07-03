# U6 Infrastructure & Integration — NFR Design Patterns (IaC)

| Pattern | Applied To | Realizes |
|---|---|---|
| **Module Composition** | new `chat` module wired from root `modules.tf` | NFR-U6-D2, BR-U6-7 (additive) |
| **for_each Lambda Factory** | `module "lambda" { for_each = local.lambda_options }` | NFR-U6-M1 (DRY, mirrors `notification`) |
| **Least-Privilege IAM Statements** | per-Lambda `statement` list in `lambda_options` | SECURITY-06, NFR-U6-S1 |
| **Stream Filter + Partial-Batch-Failure** | `filter_criteria` + `function_response_types` on the mapping | NFR-U6-A2 |
| **ARN Placeholder Substitution** | REST integration `${CHAT_*_INVOCATION_ARN}` resolved at deploy | matches existing REST API mechanism |
| **Log Retention Override** | per-module `log_retention_in_days = 90` (default is 60) | SECURITY-14 |
| **No-Payload Logging** | stage `data_trace_enabled = false` | SECURITY-03 |
| **Output Contract** | module output `websocket_api_endpoint` → mobile `WEBSOCKET_URL` | wiring |
| **Environment Parity** | same module in AWS + LocalStack | NFR-6 |

## IAM statement shape (per `lambda_option.statement`)
```hcl
statement = [
  { sid = "ChatTableRW", actions = ["dynamodb:GetItem","dynamodb:Query","dynamodb:PutItem",
      "dynamodb:UpdateItem","dynamodb:TransactWriteItems"], resources = [table_arn, "${table_arn}/index/GSI1"] },
  { sid = "ManageConns", actions = ["execute-api:ManageConnections"], resources = ["${ws_api_execution_arn}/*/POST/@connections/*"] },
  { sid = "PushQueue",  actions = ["sqs:SendMessage"], resources = [notification_queue_arn] }
]
```
(read-only Lambdas drop the write/manage/sqs statements; the stream consumer adds stream-read.)

## Failure / idempotency
- Re-`apply` is a no-op when unchanged; removing the module disables chat with no data migration.
- Deploy is ordered by Terraform's dependency graph (authorizer before routes, table/stream before
  mapping) — no manual sequencing.

## Security (consolidated) — N/A items
- PBT N/A (IaC). SECURITY-04 (web headers) N/A (no new HTML endpoint). SECURITY-10 (supply chain) —
  Terraform providers pinned by the existing lockfile; no new providers.
