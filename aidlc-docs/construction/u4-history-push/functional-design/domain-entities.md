# U4 History + Push — Domain Entities

No new persisted entity. U4 reads U1 `ChatMessage` via `ChatMessageService.getHistory` and refines the
push path.

## New pure helpers (domain — `core/application/chatWorkflow/`)
```
encodeCursor(key: Record<string, unknown>): string         // base64(JSON)
decodeCursor(encoded: string): Record<string, unknown>     // throws ChatValidation on malformed
clampLimit(limit: number | undefined): number              // -> [1, 20], default 20
```

## Handler I/O (adapter)
```
type GetChatHistoryEvent = {
  requesterId: string;     // Cognito sub (mapped by API GW integration)
  channelId: string;
  cursor?: string;
  limit?: number;
}
// 200 -> { success, data: { items: ChatMessageDTO[], nextCursor: string | null } }
```

## Modified (existing)
- `core/application/notificationWorkflow/NotificationService.ts` — add a `CHAT_MESSAGE` **publish-only**
  branch in `sendPushNotification`.

## Collaborators (existing)
- U1: `ChatMessageService`, `ChatChannelService`.
- Existing: `NotificationService` (push), `generateApiGatewayResponse`, `createHTTPLogger`, `Config`.

## API contract (OpenAPI — added in U4 Code Gen)
- `openapi/paths/chat/history.json` (`GetChatHistory`, GET) + response schema + integration file,
  `CognitoAuthorizer` security.

## No new dependencies.
