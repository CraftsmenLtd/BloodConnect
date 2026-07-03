# U6 Infrastructure & Integration — Integration Architecture

Consolidates the per-unit Infrastructure Design specs into deployable Terraform + OpenAPI wiring.

## Resource Inventory (to create)
### chat Terraform module (`iac/terraform/aws/chat/`)
- **9 Lambdas** (via shared `lambda` module `for_each`): `chat-authorizer`, `chat-connect`,
  `chat-disconnect`, `chat-send-message`, `chat-typing`, `chat-mark-read`, `chat-channel-creator`,
  `chat-get-history`, `chat-list-channels`.
- **WebSocket API** (`aws_apigatewayv2_api` WEBSOCKET) + routes (`$connect`/`$disconnect`/`sendMessage`/
  `typing`/`markRead`/`$default`) + `AWS_PROXY` integrations + **REQUEST authorizer** + stage
  (access/exec logging, `data_trace=false`) + `aws_lambda_permission`s.
- **Stream event-source mapping** → `chat-channel-creator` (`ReportBatchItemFailures`, filter on SK
  prefixes `ACCEPTED#`/`BLOOD_REQ#`, `starting_position=LATEST`).
- **IAM** per-Lambda `statement`s (least-privilege).

### Existing-REST integration (chatGetHistory, chatListChannels)
- Register `GET /chat/history` + `GET /chat/channels` in `openapi/versions/v1.json`.
- Integration files `openapi/integration/aws/chat/get-history.json` + `list-channels.json` (VTL maps
  query params + `requesterId = $context.authorizer.claims.sub`; `${CHAT_*_INVOCATION_ARN}` placeholder).

### Root wiring
- `iac/terraform/aws/modules.tf`: `module "chat" { source="./chat"; dynamodb_table_arn=...; 
  dynamodb_table_stream_arn=module.database.dynamodb_table_stream_arn; notification_queue_url=...;
  cognito_user_pool_id=...; cognito_client_id=... }`.

## Wiring Graph (text)
```
DynamoDB stream ──(filter ACCEPTED#/BLOOD_REQ#)──> chat-channel-creator
Cognito ──JWT──> chat-authorizer ──$connect──> WebSocket API ──routes──> chat-{connect,disconnect,send,typing,markRead}
chat-send-message ──execute-api:ManageConnections──> @connections/*   ; ──sqs:SendMessage──> push queue
push queue ──(existing)──> send-push-notification ──SNS──> devices
REST API (Cognito) ──> chat-get-history, chat-list-channels ──DynamoDB read──> table/GSI1
mobile ──WSS(?token)──> WebSocket API ; ──HTTPS──> REST history/channels
```

## IAM Matrix (per Lambda — least privilege, SECURITY-06)
| Lambda | DynamoDB | Other |
|---|---|---|
| chat-authorizer | — | (JWKS over HTTPS) |
| chat-connect / chat-disconnect | PutItem/DeleteItem/Query (CHAT_CONN) | — |
| chat-send-message | GetItem/Query/UpdateItem/PutItem/TransactWriteItems (table+GSI1) | `execute-api:ManageConnections`, `sqs:SendMessage` |
| chat-typing / chat-mark-read | GetItem/Query/UpdateItem (channel/conn) | `execute-api:ManageConnections` |
| chat-channel-creator | GetItem/Query/UpdateItem/PutItem/TransactWriteItems (table+GSI1) | stream read (GetRecords/GetShardIterator/DescribeStream/ListStreams) |
| chat-get-history / chat-list-channels | Query/GetItem (read-only) | — |

## Env Var Matrix
| Lambda | Env |
|---|---|
| all | `DYNAMODB_TABLE_NAME` |
| chat-authorizer | `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID` |
| chat-send-message | `NOTIFICATION_QUEUE_URL` (+ optional `WEBSOCKET_ENDPOINT`) |

## Deploy Sequence
TTL (done) → Lambdas + IAM → WebSocket API + authorizer + stage → stream mapping → REST routes/VTL +
OpenAPI registration → root module wiring → mobile `WEBSOCKET_URL`. All additive.

## Verification (Build & Test, in the user's env — terraform + Docker/LocalStack)
- `terraform fmt -check` + `terraform validate` on the chat module.
- `make bundle-openapi` + `spectral` lint with the new paths.
- LocalStack: accept request → `CHAT_CHANNEL#` items appear; WS connect+send delivers; offline →
  SQS `CHAT_MESSAGE`; `GET /chat/history` + `/chat/channels` work; complete → channel LOCKED.
