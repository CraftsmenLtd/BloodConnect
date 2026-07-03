# U6 Infrastructure & Integration — Code Generation Plan (single source of truth)

**Unit**: U6 (infrastructure consolidation — Terraform + OpenAPI wiring). **Depends on**: U1–U5 handler
code (exists). **Conventions**: mirror `iac/terraform/aws/notification/` (policies.tf locals, lambdas.tf
`lambda_options`, modules.tf `for_each` over the shared `./../lambda` module).

**Verification note**: `terraform validate` + LocalStack/AWS deploy require the operator's environment
(no terraform CLI / Docker here) — folded into **Build and Test**. U6 JSON-validates the OpenAPI edits
and structures HCL faithfully to the existing modules.

---

## Step 1 — chat Terraform module (`iac/terraform/aws/chat/`)
- [x] **CREATE** `variables.tf` (environment, dynamodb_table_arn, dynamodb_table_stream_arn,
  notification_queue_arn, notification_queue_url, cognito_user_pool_id, cognito_client_id,
  log_retention_in_days=90).
- [x] **CREATE** `policies.tf` (`locals.policies`: common/logs, chat_table_rw, chat_table_read,
  manage_connections, sqs_send, stream_read).
- [x] **CREATE** `lambdas.tf` (`locals.lambda_options` — 9 chat lambdas with handler/js_file_name/env/
  `statement = concat(...)`).
- [x] **CREATE** `modules.tf` (`module "lambda" { for_each = local.lambda_options; source="./../lambda"; ... }`).
- [x] **CREATE** `websocket.tf` (`aws_apigatewayv2_api` WEBSOCKET + REQUEST authorizer + 6 routes +
  AWS_PROXY integrations + stage with access logs + `aws_cloudwatch_log_group`(90d) + `aws_lambda_permission`s).
- [x] **CREATE** `stream_trigger.tf` (`aws_lambda_event_source_mapping` → chat-channel-creator, filter +
  ReportBatchItemFailures + bisect).
- [x] **CREATE** `outputs.tf` (`websocket_api_endpoint`).

## Step 2 — Root + dependency wiring
- [x] **MODIFY** `iac/terraform/aws/modules.tf` — instantiate `module "chat"` with table/stream/queue/cognito inputs.
- [x] **NOT NEEDED** `notification` already outputs `push_notification_queue` (use `.arn`/`.url`).
- [x] **NOT NEEDED** `cognito` already outputs `user_pool_id` + `user_pool_client_id`.

## Step 3 — REST integration + OpenAPI registration
- [x] **CREATE** `openapi/integration/aws/chat/get-history.json` + `list-channels.json` (AWS integration,
  inline VTL injecting `requesterId` from claims, `${CHAT_*_INVOCATION_ARN}` placeholders).
- [x] **MODIFY** `openapi/versions/v1.json` — register `GET /chat/history` + `GET /chat/channels`
  (referencing the path files).

## Step 4 — Minor cleanup (build hygiene)
- [~] **DOCUMENTED (follow-up)** `core/services/aws/chat/ChatPushNotifier.ts` + `websocketTypes.ts` are non-handler
  helpers in the lambda-scan path; recommend moving under `commons/` (or document) so the build doesn't
  bundle them as standalone lambdas. (Non-blocking.)

## Step 5 — Documentation
- [x] **CREATE** `aidlc-docs/construction/u6-infra-integration/code/u6-code-summary.md`.

---

## Verification (in operator env — Build & Test)
- `terraform fmt -check` + `terraform validate` (chat module + root).
- `make bundle-openapi` (Redocly) + `spectral lint` with the new paths.
- LocalStack `make start-dev` + the e2e walkthrough.

## Extension Compliance
- **Security**: SECURITY-06 (per-Lambda least-priv IAM), -02 (WS logging), -03 (no payloads), -14 (≥90d),
  -01 (TLS/at-rest). **PBT N/A** (IaC).

## Scope
- 7 new Terraform files + 3 edits + 2 OpenAPI integration files + 1 OpenAPI registration edit + 1 doc.
