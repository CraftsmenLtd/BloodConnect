# U3 Real-time Messaging — Domain Entities

U3 introduces **no new persisted entity**. It uses U1's `ChatConnection`, `ChatChannel`,
`ChatMessage` via the existing services, and adds two **port implementations** + handlers.

## Port extension (additive to U1)
- **`ChatConnectionRepository.getConnection(connectionId)`** → `ChatConnectionDTO | null`
  (direct `getItem` on `CHAT_CONN#<connectionId>` / `META`), and
- **`ChatConnectionService.getConnectionUser(connectionId)`** → `string` (throws `403` if missing).
  Needed because the WebSocket authorizer context is not propagated to message routes.

## New adapters (no persistence of their own)
- **`ApiGatewayManagementApiOperations`** implements `RealtimeNotifier`
  (`@aws-sdk/client-apigatewaymanagementapi`).
- **`ChatPushNotifier`** implements `OfflineNotifier` (enqueues `CHAT_MESSAGE` via
  `NotificationService` + SQS push queue).

## WebSocket envelope types (in-memory)
```
type InboundFrame =
  | { action: 'sendMessage'; channelId: string; body: string; clientMessageId: string }
  | { action: 'typing'; channelId: string }
  | { action: 'markRead'; channelId: string }
// Outbound = ChatRealtimeEvent (U1)
```

## Collaborators (existing)
- U1: `ChatMessageService`, `ChatChannelService`, `ChatConnectionService`, `RealtimeNotifier` /
  `OfflineNotifier` ports.
- Existing: `NotificationService`, `SQSOperations` (push), `Config`, logger, Cognito config.

## New dependencies (declared; added in U3 Code Gen)
- `aws-jwt-verify` (Cognito JWT verification in the authorizer).
- `@aws-sdk/client-apigatewaymanagementapi` (real-time post-to-connection).
