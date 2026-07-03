# U3 Real-time Messaging — Infrastructure Design

New AWS infrastructure for the WebSocket chat API. Lives in the new `chat` Terraform module
(authored/consolidated in U6); specified here.

## API Gateway — WebSocket API
```hcl
resource "aws_apigatewayv2_api" "chat_ws" {
  name                       = "${var.environment}-bloodConnect-chat-ws"
  protocol_type              = "WEBSOCKET"
  route_selection_expression = "$request.body.action"
}
```
- **Routes**: `$connect` (authorized), `$disconnect`, `sendMessage`, `typing`, `markRead`, `$default`.
- **Integrations**: `AWS_PROXY` to the respective Lambda for each route.
- **Authorizer** (REQUEST, on `$connect`):
```hcl
resource "aws_apigatewayv2_authorizer" "chat_ws_authorizer" {
  api_id           = aws_apigatewayv2_api.chat_ws.id
  authorizer_type  = "REQUEST"
  authorizer_uri   = module.lambda["chat-authorizer"].lambda_invoke_arn
  identity_sources = ["route.request.querystring.token"]
  name             = "chat-ws-authorizer"
}
```
- **Stage** with **access + execution logging** (SECURITY-02) to a CloudWatch log group
  (retention ≥ 90d — SECURITY-14):
```hcl
resource "aws_apigatewayv2_stage" "chat_ws" {
  api_id      = aws_apigatewayv2_api.chat_ws.id
  name        = var.environment
  auto_deploy = true
  access_log_settings { destination_arn = aws_cloudwatch_log_group.chat_ws.arn  format = jsonencode({...}) }
  default_route_settings { logging_level = "INFO"  data_trace_enabled = false }   # data_trace off → no message bodies in logs
}
```
- `aws_lambda_permission` granting `apigateway.amazonaws.com` invoke on each handler + the authorizer.

## Lambdas (chat WS handlers)
| Lambda | Handler | Extra env |
|---|---|---|
| `chat-authorizer` | `chatAuthorizer.default` | `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID` |
| `chat-connect` | `chatConnect.default` | `DYNAMODB_TABLE_NAME` |
| `chat-disconnect` | `chatDisconnect.default` | `DYNAMODB_TABLE_NAME` |
| `chat-send-message` | `chatSendMessage.default` | `DYNAMODB_TABLE_NAME`, `NOTIFICATION_QUEUE_URL` |
| `chat-typing` | `chatTyping.default` | `DYNAMODB_TABLE_NAME` |
| `chat-mark-read` | `chatMarkRead.default` | `DYNAMODB_TABLE_NAME` |

## IAM — least privilege (SECURITY-06)
- **Message handlers** (send/typing/markRead): `execute-api:ManageConnections` on
  `arn:aws:execute-api:<region>:<acct>:<apiId>/<stage>/POST/@connections/*`; DynamoDB
  GetItem/Query/UpdateItem/PutItem/TransactWriteItems on table + GSI1.
- **send-message** additionally: `sqs:SendMessage` on the push queue ARN.
- **connect/disconnect**: DynamoDB PutItem/DeleteItem/Query (connection items) only.
- **authorizer**: no DynamoDB; outbound HTTPS to Cognito JWKS (public).
- No wildcards beyond the required `@connections/*` resource path.

## Encryption / transport
- **WSS** (TLS) enforced by API Gateway; at-rest via the shared table.

## Security mapping
- SECURITY-02 (access/exec logging) ✅; -06 (IAM) ✅; -08/-12 (authorizer) ✅; -14 (retention ≥90d) ✅;
  -01 (WSS/at-rest) ✅; -03 (`data_trace_enabled = false` → no payloads in logs) ✅.
