# U3 Real-time Messaging — Deployment Architecture

## Packaging
- 6 handlers (`chatAuthorizer`, `chatConnect`, `chatDisconnect`, `chatSendMessage`, `chatTyping`,
  `chatMarkRead`) bundled by esbuild into the chat Lambda artifacts.

## Terraform (new `chat` module — consolidated in U6)
- `aws_apigatewayv2_api` (WEBSOCKET) + 6 routes + integrations + REQUEST authorizer + stage (access +
  exec logging) + deployment; `aws_lambda_permission` per handler/authorizer; per-Lambda IAM.
- Wires `module.dynamodb` (table/stream/GSI1), the notification SQS queue, and Cognito pool/client ids.

## Client callback endpoint
- Message handlers post via `https://${requestContext.domainName}/${requestContext.stage}` (derived
  per request); `WEBSOCKET_ENDPOINT` env override for **LocalStack**.

## Environments
- **AWS** (ap-south-1): full WebSocket API.
- **LocalStack**: API Gateway v2 WebSocket + Lambda authorizer support varies by LocalStack
  edition — U6 validates; fall back to documented manual test if a feature is unsupported locally.

## Rollout / Rollback
- **Rollout**: deploy chat Lambdas + WebSocket API; mobile points at the new WSS URL (U5).
- **Rollback**: remove/disable the WebSocket API stage → real-time chat unavailable; channels +
  history (REST, U4) remain; no data migration.

## Validation (LocalStack / AWS)
- Connect with a valid Cognito token → connection stored; send a message → recipient socket receives
  `MESSAGE` event and (if offline) a `CHAT_MESSAGE` SQS item is enqueued; invalid token → `403`.
