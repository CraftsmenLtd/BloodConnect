# U6 Infrastructure & Integration — Functional Design Plan

> U6 is the **infrastructure consolidation** unit — no business logic. Its "functional design" is the
> integration architecture that turns the U1–U5 code into a deployable, runnable feature. Answers
> pre-filled with recommendations per the user's standing instruction. Grounded in the per-unit
> Infrastructure Design docs.

### Q-1 — New Terraform module layout
[Answer]: New module `iac/terraform/aws/chat/` (mirrors `notification/`): `lambdas.tf` (locals
`lambda_options` for all 9 chat Lambdas with per-Lambda IAM `statement`), `modules.tf`
(`module "lambda" { for_each = local.lambda_options ... }`), `websocket.tf` (API GW v2),
`stream_trigger.tf` (event-source mapping), `variables.tf`, `outputs.tf`. Instantiated from the root
`iac/terraform/aws/modules.tf` with `dynamodb_table_arn` + `dynamodb_table_stream_arn` + notification
queue + Cognito ids.

### Q-2 — REST vs WebSocket split
[Answer]: **WebSocket** API GW v2 for `chatConnect/Disconnect/SendMessage/Typing/MarkRead` + authorizer
(in the chat module). **REST** `chatGetHistory` + `chatListChannels` plug into the **existing**
OpenAPI-driven REST API (register paths in `openapi/versions/v1.json` + integration VTL +
`${..._INVOCATION_ARN}` placeholders). `chatChannelCreator` is **stream-triggered** (no API).

### Q-3 — OpenAPI registration
[Answer]: Add `GET /chat/history` and `GET /chat/channels` to `openapi/versions/v1.json` referencing the
path files; create `openapi/integration/aws/chat/get-history.json` + `list-channels.json` (VTL request
mapping injecting `requesterId` from `$context.authorizer.claims.sub`).

### Q-4 — Env var matrix
[Answer]: Per-Lambda env: all chat Lambdas get `DYNAMODB_TABLE_NAME`; `chatAuthorizer` gets
`COGNITO_USER_POOL_ID` + `COGNITO_CLIENT_ID`; `chatSendMessage` gets `NOTIFICATION_QUEUE_URL`;
realtime endpoint derived from `requestContext` (+ `WEBSOCKET_ENDPOINT` override for LocalStack).

### Q-5 — LocalStack parity
[Answer]: Same module under the LocalStack deployment; document feature caveats (WS authorizer support
varies by edition) + a manual e2e test path. Validate accept→channel→message→push→history→lock.

### Q-6 — Deploy sequence
[Answer]: TTL (done U1) → chat Lambdas → IAM → WebSocket API + authorizer → stream mapping → REST routes
→ env wiring → mobile `WEBSOCKET_URL`. Additive; rollback by removing the module.

## Checklist
- [x] business-logic-model.md (integration architecture: resource inventory + wiring graph + sequence)
- [x] business-rules.md (deployment/wiring/IAM rules)
- [x] domain-entities.md (resource inventory table; no domain entities — infra unit)
