# U3 Real-time Messaging — Code Generation Plan (single source of truth)

**Unit**: U3 Real-time Messaging (WebSocket). **Stories**: US-4, US-7, US-8, US-11, US-12 (+ US-10
backend push). **Depends on**: U1 (chat services + ports). **Conventions**: TS strict, no `any`, single
quotes/no semicolons/150-col; reuse existing handler wiring; fast-check + aws-sdk-client-mock.

**Infra note**: WebSocket API Gateway + routes + authorizer attachment + IAM **Terraform deferred to
U6**. U3 delivers application code + tests.

---

## Step 1 — WS envelope (domain, pure)
- [x] **CREATE** `core/application/chatWorkflow/wsFrame.ts` — `InboundFrame` union, `parseInboundFrame`
  (JSON.parse + shape), `validateInboundFrame` (action allowlist, channelId, body ≤ 2000, ids;
  reuses `validateChannelId`/`validateBody`/`validateIds`).

## Step 2 — Connection→user extension (additive to U1)
- [x] **MODIFY** `core/application/models/policies/repositories/ChatConnectionRepository.ts` — add
  `getConnection(connectionId): Promise<ChatConnectionDTO | null>`.
- [x] **MODIFY** `core/application/chatWorkflow/ChatConnectionService.ts` — add
  `getConnectionUser(connectionId): Promise<string>` (throws `403` via `ChatOperationError` if absent).
- [x] **MODIFY** `core/services/aws/commons/ddbOperations/ChatConnectionDynamoDbOperations.ts` —
  implement `getConnection` (getItem on `CHAT_CONN#<id>` / `META`).

## Step 3 — Adapters
- [x] **CREATE** `core/services/aws/commons/realtime/ApiGatewayManagementApiOperations.ts` — implements
  `RealtimeNotifier` (`@aws-sdk/client-apigatewaymanagementapi` `PostToConnectionCommand`;
  `GoneException` → stale).
- [x] **CREATE** `core/services/aws/chat/ChatPushNotifier.ts` — implements `OfflineNotifier` (enqueue
  `CHAT_MESSAGE` via `NotificationService` + SQS push queue).

## Step 4 — Authorizer
- [x] **CREATE** `core/services/aws/chat/chatAuthorizer.ts` — REQUEST authorizer; module-scope
  `CognitoJwtVerifier`; verify `?token=`; return Allow policy + `context.userId` (sub); Deny on failure.

## Step 5 — WebSocket route handlers
- [x] **CREATE** `core/services/aws/chat/chatConnect.ts` (registerConnection from authorizer userId).
- [x] **CREATE** `core/services/aws/chat/chatDisconnect.ts` (removeConnection).
- [x] **CREATE** `core/services/aws/chat/chatSendMessage.ts` (getConnectionUser → validate frame →
  `ChatMessageService.sendMessage` with realtime + offline adapters).
- [x] **CREATE** `core/services/aws/chat/chatTyping.ts` (broadcast TYPING to other participant).
- [x] **CREATE** `core/services/aws/chat/chatMarkRead.ts` (`ChatMessageService.markRead`).

## Step 6 — Dependencies
- [x] **MODIFY** `package.json` — add `aws-jwt-verify` and `@aws-sdk/client-apigatewaymanagementapi`
  (pinned; SECURITY-10).

## Step 7 — Tests
- [x] **CREATE** `core/application/tests/chatWorkflow/wsFrame.test.ts` (PBT round-trip + validation).
- [x] **CREATE** `core/services/aws/tests/commons/realtime/ApiGatewayManagementApiOperations.test.ts`
  (mock: post ok; `GoneException` → returned as stale; other error → not stale).
- [x] **CREATE** `core/services/aws/tests/chat/chatConnect.test.ts` (connect + disconnect register/remove).
- [x] **CREATE** `core/services/aws/tests/chat/chatSendMessage.test.ts` (mock services; resolves
  senderId via getConnectionUser; calls sendMessage; 403 when connection unknown).
- [x] **CREATE** `core/services/aws/tests/chat/chatAuthorizer.test.ts` (mock `aws-jwt-verify`: valid →
  Allow + userId; invalid → Deny/Unauthorized).

## Step 8 — Documentation
- [x] **CREATE** `aidlc-docs/construction/u3-realtime-messaging/code/u3-code-summary.md`.

---

## Story Traceability
| Story | Implemented by (U3) |
|---|---|
| US-4 | chatSendMessage + ApiGatewayManagementApiOperations |
| US-7 | chatTyping |
| US-8 | chatMarkRead |
| US-11 | chatAuthorizer + getConnectionUser (participant via U1) |
| US-12 | rate-limit enforced by U1 ChatMessageService (wired) |
| US-10 (backend) | ChatPushNotifier (offline → CHAT_MESSAGE) |

## Extension Compliance Targets
- **PBT**: PBT-02 (frame + event round-trip), PBT-03 (stale-only invariant), PBT-10 (example + property).
- **Security**: SECURITY-05 (frame validation), -08/-12 (authorizer/JWT), -15/-03 (fail-closed/redact).
  IAM (-06), access logging (-02) realized in U6 Terraform.

## Scope
- ~10 source files (incl. 3 modified) + 2 deps + ~5 test files + 1 doc. Terraform → U6.
