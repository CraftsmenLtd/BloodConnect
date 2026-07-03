# U6 Infrastructure & Integration — Concrete Resource Spec

The precise spec the U6 code-gen implements. Lambda handler files exist (U2/U3/U4/U5); esbuild bundles
them to `<name>.js`.

## `local.lambda_options` (9 entries)
| key (name) | handler | js_file_name | env | IAM statements |
|---|---|---|---|---|
| chat-authorizer | `chatAuthorizer.default` | chatAuthorizer.js | COGNITO_USER_POOL_ID, COGNITO_CLIENT_ID | common only |
| chat-connect | `chatConnect.default` | chatConnect.js | DYNAMODB_TABLE_NAME | conn-rw |
| chat-disconnect | `chatDisconnect.default` | chatDisconnect.js | DYNAMODB_TABLE_NAME | conn-rw |
| chat-send-message | `chatSendMessage.default` | chatSendMessage.js | DYNAMODB_TABLE_NAME, NOTIFICATION_QUEUE_URL | table-rw + manage-conns + sqs-send |
| chat-typing | `chatTyping.default` | chatTyping.js | DYNAMODB_TABLE_NAME | table-r + conn-r + manage-conns |
| chat-mark-read | `chatMarkRead.default` | chatMarkRead.js | DYNAMODB_TABLE_NAME | table-rw + conn-r + manage-conns |
| chat-channel-creator | `chatChannelCreator.default` | chatChannelCreator.js | DYNAMODB_TABLE_NAME | table-rw + stream-read |
| chat-get-history | `chatGetHistory.default` | chatGetHistory.js | DYNAMODB_TABLE_NAME | table-read |
| chat-list-channels | `chatListChannels.default` | chatListChannels.js | DYNAMODB_TABLE_NAME | table-read (GSI1) |

IAM statement bodies: see `../nfr-design/nfr-design-patterns.md`. `resources` use `var.dynamodb_table_arn`,
`"${var.dynamodb_table_arn}/index/GSI1"`, `var.notification_queue_arn`, the WS API execution ARN
`@connections/*`, and the stream ARN.

## WebSocket API (`websocket.tf`)
- `aws_apigatewayv2_api.chat_ws` (protocol WEBSOCKET, `route_selection_expression="$request.body.action"`).
- `aws_apigatewayv2_authorizer.chat_ws` (REQUEST, `identity_sources=["route.request.querystring.token"]`,
  `authorizer_uri = module.lambda["chat-authorizer"].lambda_invoke_arn`).
- Routes + integrations (AWS_PROXY): `$connect` (authorizer), `$disconnect`, `sendMessage`, `typing`,
  `markRead`, `$default`.
- `aws_apigatewayv2_stage.chat_ws` (`auto_deploy=true`, `access_log_settings` → `aws_cloudwatch_log_group`
  with `retention_in_days=90`, `default_route_settings { logging_level="INFO" data_trace_enabled=false }`).
- `aws_lambda_permission` for `apigateway.amazonaws.com` per route handler + authorizer.

## Stream trigger (`stream_trigger.tf`)
```hcl
resource "aws_lambda_event_source_mapping" "chat_channel_creator" {
  event_source_arn        = var.dynamodb_table_stream_arn
  function_name           = module.lambda["chat-channel-creator"].lambda_function_name
  starting_position       = "LATEST"
  batch_size              = 10
  function_response_types = ["ReportBatchItemFailures"]
  bisect_batch_on_function_error = true
  filter_criteria { filter { pattern = jsonencode({ dynamodb = { Keys = { SK = { S = [ { prefix = "ACCEPTED#" }, { prefix = "BLOOD_REQ#" } ] } } } }) } }
}
```

## Module inputs / outputs (`variables.tf` / `outputs.tf`)
- inputs: `environment`, `dynamodb_table_arn`, `dynamodb_table_stream_arn`, `notification_queue_arn`,
  `notification_queue_url`, `cognito_user_pool_id`, `cognito_client_id`, `log_retention_in_days=90`.
- output: `websocket_api_endpoint = aws_apigatewayv2_stage.chat_ws.invoke_url`.

## Root wiring (`modules.tf` edit)
```hcl
module "chat" {
  source                    = "./chat"
  environment               = var.environment
  dynamodb_table_arn        = module.database.dynamodb_table_arn
  dynamodb_table_stream_arn = module.database.dynamodb_table_stream_arn
  notification_queue_arn    = module.notification.push_notification_queue_arn   # add output if absent
  notification_queue_url    = module.notification.push_notification_queue_url
  cognito_user_pool_id      = module.cognito.user_pool_id
  cognito_client_id         = module.cognito.user_pool_client_id
}
```
*(If `notification`/`cognito` modules don't already expose these outputs, U6 adds them.)*

## REST integration (OpenAPI)
- Register `GET /chat/history` + `GET /chat/channels` in `openapi/versions/v1.json`.
- `openapi/integration/aws/chat/get-history.json` + `list-channels.json`: `type=aws`, `httpMethod=POST`,
  `uri=${CHAT_GET_HISTORY_INVOCATION_ARN}` / `${CHAT_LIST_CHANNELS_INVOCATION_ARN}`, inline VTL request
  template mapping `channelId`/`cursor`/`limit` + `requesterId=$context.authorizer.claims.sub`.

## Security mapping
- SECURITY-06 (per-Lambda least-priv) ✅, -02 (WS logging) ✅, -03 (no payloads) ✅, -14 (≥90d) ✅,
  -01 (TLS/at-rest) ✅.
