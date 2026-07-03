# U4 History + Push — Infrastructure Design

Adds a REST endpoint + Lambda for chat history; reuses the existing push pipeline.

## Compute — Lambda `chat-get-history`
- Handler `chatGetHistory.default` (esbuild bundle), env `DYNAMODB_TABLE_NAME`, region.
- Log retention ≥ 90d (SECURITY-14).

## REST API — `GET /chat/history`
- OpenAPI-driven (the repo deploys the REST API from the OpenAPI document):
  - `openapi/paths/chat/history.json` (`GetChatHistory`, GET) with `CognitoAuthorizer` security,
    `x-amazon-apigateway-request-validator: ValidateBodyAndQuery`, and an
    `x-amazon-apigateway-integration` `$ref` to a new integration file
    (`openapi/integration/aws/chat/get-history.json`) → AWS_PROXY to `chat-get-history`.
  - Query params: `channelId` (required), `cursor` (optional), `limit` (optional).
  - The integration request mapping injects `requesterId = $context.authorizer.claims.sub` into the
    Lambda event (same pattern existing handlers use to receive the authenticated user id).
- `aws_lambda_permission` for API Gateway to invoke the Lambda.

## Push (reuse — no new resource)
- `CHAT_MESSAGE` flows through the **existing** SQS push queue + `send-push-notification` Lambda + SNS;
  U4 only adds the publish-only branch in code. No infra change.

## IAM — least privilege (SECURITY-06)
- `chat-get-history`: DynamoDB `Query` + `GetItem` on the table ARN (read of `CHAT_MSG#`/`CHAT_CHANNEL#`
  items + membership for participant check). **Read-only**; no write/stream/SQS perms.

## Encryption / logging
- HTTPS (REST) + at-rest (shared table). API GW access/execution logging already configured for the
  REST API; the new path inherits it (SECURITY-02). `data_trace` off → no payloads logged.

## Security mapping
- SECURITY-06 (read-only IAM) ✅; -08 (Cognito authorizer + claims→requesterId) ✅; -02 (REST logging,
  inherited) ✅; -14 (retention ≥90d) ✅; -01 (HTTPS/at-rest) ✅.
