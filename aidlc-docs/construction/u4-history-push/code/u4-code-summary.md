# U4 History + Push — Code Generation Summary

**Status**: Generated and verified. **Tests**: 10 U4 tests (chat suite total **88**, 20 suites).
**Type-check**: no chat errors. **ESLint**: clean. **OpenAPI JSON**: valid. **New deps**: none.

## Created — Domain (`core/application/chatWorkflow/`)
- `cursor.ts` — `encodeCursor` / `decodeCursor` (throws on malformed) / `clampLimit` → `[1,20]`.

## Modified
- `chatWorkflow/Types.ts` — `GetChatHistoryEvent`.
- `notificationWorkflow/NotificationService.ts` — **`CHAT_MESSAGE` publish-only branch** in
  `sendPushNotification` (publishes via SNS; does **not** persist a generic notification record),
  ordered before the generic `else`.

## Created — Adapter
- `core/services/aws/chat/chatGetHistory.ts` — REST handler (decode cursor → clamp → `getHistory` →
  encode `nextCursor` → `generateApiGatewayResponse`; `ChatOperationError` → status mapping).

## Created — OpenAPI (contract; satisfies the ticket's "document getHistory" AC)
- `openapi/paths/chat/history.json` (`GetChatHistory`, GET, query params, `CognitoAuthorizer`,
  request validator, integration `$ref`).
- `openapi/components/schemas/chat/history-response.json` (response model).

## Created — Tests (10)
- `cursor.test.ts` (PBT round-trip + clamp invariant + malformed-cursor), `chatGetHistory.test.ts`
  (success/nextCursor, 403, malformed-cursor 400), `NotificationService.test.ts` (CHAT_MESSAGE
  publish-only + COMMON-still-persists regression guard).

## Deferred to U6
- `openapi/integration/aws/chat/get-history.json` (VTL request mapping + invocation-ARN placeholder),
  registering the path in the root OpenAPI doc, the `chat-get-history` Lambda registration + read-only
  IAM (Terraform).

## Extension compliance
- **PBT**: PBT-02 (cursor round-trip), PBT-03 (limit clamp invariant), PBT-10 (example + property). ✅
- **Security**: SECURITY-05 (cursor/limit/channelId), -08 (cognito identity + participant), -15/-03
  (fail-closed, redaction). IAM (-06) in U6. ✅

## Story coverage
US-5 (history), US-10 backend (publish-only push with deep-link payload from U3).
