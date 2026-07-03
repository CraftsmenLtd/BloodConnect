# U6 Infrastructure & Integration — Code Generation Summary

**Status**: Generated. **OpenAPI JSON**: all valid + chat paths registered. **Terraform**: 8 module
files + root wiring authored (faithful to the `notification`/`lambda` patterns). **`terraform validate`
+ LocalStack/AWS deploy run in the operator env** (Build & Test) — no terraform CLI/Docker here.

## Created — chat Terraform module (`iac/terraform/aws/chat/`)
- `variables.tf`, `local.tf` (table name + GSI1 arn), `policies.tf` (least-priv `locals.policies`),
  `lambdas.tf` (9 `lambda_options` with per-Lambda `statement = concat(...)`), `modules.tf`
  (`for_each` over `./../lambda`), `websocket.tf` (API + REQUEST authorizer + 6 routes/integrations +
  stage logging + log group(90d) + lambda permissions), `stream_trigger.tf` (event-source mapping +
  `filter_criteria` + `ReportBatchItemFailures` + bisect), `outputs.tf`
  (`websocket_api_endpoint`, `lambda_metadata`).

## Modified — root wiring
- `iac/terraform/aws/modules.tf` — `module "chat"` fed `module.database.dynamodb_table_arn` +
  `dynamodb_table_stream_arn`, `module.notification.push_notification_queue.arn/.url`,
  `module.cognito.user_pool_id/.user_pool_client_id`. (No new outputs needed — all existed.)

## Created / Modified — REST + OpenAPI
- `openapi/integration/aws/chat/get-history.json` + `list-channels.json` (AWS integration, inline VTL
  injecting `requesterId = $context.authorizer.claims.sub`, `${CHAT_*_INVOCATION_ARN}` placeholders).
- `openapi/versions/v1.json` — registered `GET /chat/history` + `GET /chat/channels`.

## Verified here
- All 7 chat OpenAPI JSON files parse; `/chat/history` + `/chat/channels` present in `v1.json`.
- Wiring references verified to exist: `module.database.dynamodb_table_stream_arn`,
  `module.notification.push_notification_queue`, `module.cognito.user_pool_id/_client_id`.

## Follow-ups (non-blocking)
- `core/services/aws/chat/ChatPushNotifier.ts` + `websocketTypes.ts` are non-handler helpers in the
  lambda-scan path — they'd be bundled as unused `.js` (not referenced by any `lambda_option`, so
  harmless). Recommend relocating under `commons/` in a cleanup PR.
- REST integration VTL maps query params as strings (handler coerces via `clampLimit`/cursor checks);
  refine VTL if stricter typing is desired.
- The mobile nav/notification/entry-button wiring (U5 remaining) + per-env `WEBSOCKET_URL` from
  `module.chat.websocket_api_endpoint`.

## Extension compliance
- **Security**: SECURITY-06 (per-Lambda least-priv IAM matrix), -02 (WS access/exec logging), -03
  (`data_trace=false`), -14 (≥90d retention), -01 (WSS/at-rest). ✅  **PBT N/A** (IaC).
