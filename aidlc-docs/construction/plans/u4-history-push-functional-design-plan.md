# U4 History + Push — Functional Design Plan

> Answers pre-filled with recommendations per the user's standing instruction.

### Q-1 — History endpoint
[Answer]: `chatGetHistory` REST GET handler → `ChatMessageService.getHistory(channelId, requesterId,
channelService, limit, cursor)`. `requesterId` = the Cognito `sub` mapped by the API Gateway
integration template (same pattern as existing handlers receiving `seekerId`/`donorId`). Query params:
`channelId` (required), `cursor` (optional, opaque base64 of `LastEvaluatedKey`), `limit` (optional,
default/cap 20). Participant check (403) via U1.

### Q-2 — Cursor encoding
[Answer]: Encode `LastEvaluatedKey` as a base64 JSON string for the client; decode on the way in. Keeps
the DynamoDB key opaque to clients.

### Q-3 — CHAT_MESSAGE push handling (CODE-GROUNDED)
[Answer]: Verified `NotificationService.sendPushNotification`: a `CHAT_MESSAGE` currently falls into the
generic `else` branch → it would `createNotification` (**persist a notification record per message**) +
publish. That table bloat / leakage into the generic notification list is undesirable. **Add a
publish-only branch for `CHAT_MESSAGE`**: skip persistence, just `publishNotification` (chat messages
are already stored in the chat tables). Minimal, isolated change.

### Q-4 — Push payload / deep-link contract
[Answer]: `CHAT_MESSAGE` payload (set by U3 `ChatPushNotifier`): `{ channelId, requestPostId, seekerId,
donorId, senderId, messageId }` + `title`/`body` (preview). This is the deep-link contract the **mobile
app (U5)** consumes to open the correct `ChatRoom`. U4 owns the contract + ensures the push carries it.

### Q-5 — OpenAPI
[Answer]: Add `openapi/paths/chat/history.json` (operationId `GetChatHistory`, GET, query params,
`CognitoAuthorizer` security, integration `$ref`) + a response schema + the integration file, following
the existing path/integration/schema layout.

## Checklist
- [x] business-logic-model.md (history handler flow + cursor codec + CHAT_MESSAGE publish-only)
- [x] business-rules.md
- [x] domain-entities.md (no new entity; cursor codec; OpenAPI contract)
