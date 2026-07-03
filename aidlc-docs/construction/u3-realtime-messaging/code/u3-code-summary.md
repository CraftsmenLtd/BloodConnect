# U3 Real-time Messaging — Code Generation Summary

**Status**: Generated and verified. **Tests**: 25 U3 tests (chat suite total **78**, 17 suites).
**Type-check**: no chat errors. **ESLint**: clean. **Deps installed**: `aws-jwt-verify@4.0.1`,
`@aws-sdk/client-apigatewaymanagementapi`.

## Created — Domain (`core/application/chatWorkflow/`)
- `wsFrame.ts` — `InboundFrame` union + `parseInboundFrame` / `validateInboundFrame` (reuses U1
  validators).

## Modified — additive connection→user lookup
- `models/policies/repositories/ChatConnectionRepository.ts` — `getConnection(connectionId)`.
- `chatWorkflow/ChatConnectionService.ts` — `getConnectionUser(connectionId)` (403 if absent).
- `commons/ddbOperations/ChatConnectionDynamoDbOperations.ts` — `getConnection` (getItem).

## Created — Adapters
- `core/services/aws/commons/realtime/ApiGatewayManagementApiOperations.ts` — `RealtimeNotifier`
  (`PostToConnectionCommand`; `GoneException` → stale).
- `core/services/aws/chat/ChatPushNotifier.ts` — `OfflineNotifier` (enqueue `CHAT_MESSAGE` to SQS).
- `core/services/aws/chat/websocketTypes.ts` — shared WS event type + endpoint resolver + error mapper.

## Created — Handlers (`core/services/aws/chat/`)
- `chatAuthorizer.ts` (REQUEST authorizer, `aws-jwt-verify`, `?token=` → Allow + `userId`),
  `chatConnect.ts`, `chatDisconnect.ts`, `chatSendMessage.ts`, `chatTyping.ts`, `chatMarkRead.ts`.

## Modified — deps
- `core/services/aws/package.json` — `aws-jwt-verify`, `@aws-sdk/client-apigatewaymanagementapi`,
  `@aws-sdk/util-dynamodb` (explicit).

## Created — Tests (25)
- `wsFrame.test.ts` (PBT round-trip + validation), `ApiGatewayManagementApiOperations.test.ts`
  (GoneException → stale), `chatConnect.test.ts` (connect/disconnect), `chatSendMessage.test.ts`
  (getConnectionUser dispatch + 403 + malformed), `chatAuthorizer.test.ts` (valid/invalid/missing).

## Bug caught during generation
- After adding `getConnection` to the connection port, two existing U1 mock repos failed type-check
  (missing member) — added `getConnection: jest.fn()` to both. Also removed an unused import + a bad
  eslint-disable in the authorizer test.

## Identity / security note
- Only `$connect` is authenticated (JWT verified server-side); message routes bind identity via
  `getConnectionUser(connectionId)` — clients cannot spoof `senderId`.

## Deferred to U6
- WebSocket API Gateway + routes + authorizer attachment + IAM (`execute-api:ManageConnections`,
  `sqs:SendMessage`) + access logging + Cognito/endpoint env wiring.

## Extension compliance
- **PBT**: PBT-02 (frame round-trip), PBT-03 (stale-only invariant), PBT-10 (example + property). ✅
- **Security**: SECURITY-05 (frame validation), -08/-12 (authorizer/JWT, server-side identity),
  -15/-03 (fail-closed, redaction). IAM (-06) + access logging (-02) in U6. ✅

## Story coverage
US-4 (send), US-7 (typing), US-8 (markRead), US-11 (auth + participant), US-12 (rate-limit wired),
US-10 backend (offline push).
