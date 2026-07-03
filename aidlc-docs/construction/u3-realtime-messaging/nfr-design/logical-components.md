# U3 Real-time Messaging — Logical Components

## New (adapters — `core/services/aws/chat/`)
- **`chatAuthorizer`** — REQUEST authorizer; module-scope `CognitoJwtVerifier` (JWKS cache).
- **`chatConnect`**, **`chatDisconnect`**, **`chatSendMessage`**, **`chatTyping`**, **`chatMarkRead`**
  — WebSocket route handlers (thin; build services + adapters, delegate to U1).
- **`ApiGatewayManagementApiOperations`** (`core/services/aws/commons/realtime/`) — implements
  `RealtimeNotifier`.
- **`ChatPushNotifier`** (`core/services/aws/chat/` or `commons/`) — implements `OfflineNotifier`
  (enqueue `CHAT_MESSAGE` via `NotificationService` + SQS).

## New (domain — small additions)
- **`parseInboundFrame` / `validateInboundFrame`** (`core/application/chatWorkflow/`) — WS envelope
  parsing + validation (pure; PBT round-trip).
- **`ChatConnectionService.getConnectionUser` / `ChatConnectionRepository.getConnection`** — additive
  to U1.

## Reused
- U1: `ChatMessageService`, `ChatChannelService`, `ChatConnectionService`, ports.
- Existing: `NotificationService`, `SQSOperations`, `Config`, logger.

## Component Interaction (logical)
```
$connect --(?token=)--> chatAuthorizer (verify Cognito JWT) --Allow+userId--> chatConnect -> registerConnection
sendMessage -> getConnectionUser -> validateInboundFrame -> ChatMessageService.sendMessage
                  -> RealtimeNotifier.postToConnections (fan-out, prune stale)
                  -> if recipient offline: OfflineNotifier (SQS CHAT_MESSAGE)
typing/markRead -> getConnectionUser -> ChatChannelService/ChatMessageService -> RealtimeNotifier
```

## Deferred infrastructure (U3 Infra Design → U6)
- API Gateway **WebSocket** API + routes + the Lambda authorizer attachment + WSS + access logging.
- IAM: `execute-api:ManageConnections`, `sqs:SendMessage`, scoped DynamoDB.
- Env: Cognito pool/client ids, WebSocket endpoint; LocalStack parity.
