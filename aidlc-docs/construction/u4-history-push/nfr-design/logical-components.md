# U4 History + Push — Logical Components

## New (domain — `core/application/chatWorkflow/`)
- **`cursor.ts`** — `encodeCursor` / `decodeCursor` / `clampLimit` (pure).

## New (adapter — `core/services/aws/chat/`)
- **`chatGetHistory.ts`** — REST handler: build services, decode cursor, clamp limit, call
  `ChatMessageService.getHistory`, encode `nextCursor`, return via `generateApiGatewayResponse`.

## Modified (existing)
- **`core/application/notificationWorkflow/NotificationService.ts`** — add `CHAT_MESSAGE`
  publish-only branch in `sendPushNotification`.

## New (API spec — `openapi/`)
- `paths/chat/history.json` (`GetChatHistory`), a response schema component, and an integration file —
  following the existing path/integration/schema layout.

## Reused
- U1: `ChatMessageService`, `ChatChannelService`, `ChatChannelDynamoDbOperations`,
  `ChatMessageDynamoDbOperations`.
- Existing: `generateApiGatewayResponse`, `createHTTPLogger`, `Config`, `NotificationService`, SNS.

## Component Interaction (logical)
```
GET history (Cognito) -> chatGetHistory
   decodeCursor + clampLimit -> ChatMessageService.getHistory (participant-checked)
   -> encodeCursor(nextKey) -> generateApiGatewayResponse
send-push-notification (SQS) -> NotificationService.sendPushNotification
   -> if CHAT_MESSAGE: publishNotification only (no persist)
```

## Deferred infrastructure (U4 Infra Design → U6)
- REST route + integration + request validator + IAM (DynamoDB read) for `chat-get-history`.
