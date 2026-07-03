# Component Dependencies — Issue #571 (In-app Chat)

## Dependency Matrix
| Component | Depends On | Communication |
|---|---|---|
| chatChannelCreator (stream) | ChatChannelService, BloodDonationService (context), Logger | DynamoDB Stream event |
| chatSendMessage | ChatMessageService, ChatChannelService, ChatConnectionService, RealtimeNotifier, NotificationService(QueueModel) | WebSocket route |
| chatConnect | chatAuthorizer (authz), ChatConnectionService | WebSocket `$connect` |
| chatDisconnect | ChatConnectionService | WebSocket `$disconnect` |
| chatTyping | ChatConnectionService, RealtimeNotifier | WebSocket route |
| chatMarkRead | ChatMessageService, ChatConnectionService, RealtimeNotifier | WebSocket route |
| chatGetHistory | ChatMessageService, ChatChannelService | REST (Cognito) |
| ChatChannelService | ChatChannelRepository | in-process |
| ChatMessageService | ChatMessageRepository, ChatChannelService | in-process |
| ChatConnectionService | ChatConnectionRepository | in-process |
| RealtimeNotifier (port) | ApiGatewayManagementApiOperations, ChatConnectionService | AWS SDK (post-to-connection) |
| *DynamoDbOperations (3) | DynamoDbTableOperations (existing base), chat key models | DynamoDB SDK |
| Mobile hooks | WebSocket API, REST history API, push deep-link | network |

## Layered Dependency Direction (text)
```
Lambda handlers (core/services/aws/chat)
        |  build + inject
        v
Domain services (core/application/chatWorkflow)
        |  depend on
        v
Ports: ChatChannelRepository / ChatMessageRepository / ChatConnectionRepository / RealtimeNotifier
        ^
        |  implemented by
AWS adapters (core/services/aws/commons): *DynamoDbOperations, ApiGatewayManagementApiOperations
        |  use
        v
AWS SDK v3 (DynamoDB, ApiGatewayManagementApi, SQS) + existing logger/config
```
Dependency rule: `core/application` never imports AWS SDK directly — only ports (same as the
existing `AcceptDonationRepository` / `QueueModel` separation).

## New vs Reused
- **New**: `chatWorkflow` services + ports; 8 chat handlers; 3 DynamoDB models+operations;
  ApiGatewayManagementApi adapter; 3 DTOs; `CHAT_MESSAGE` enum value; mobile screens/hooks;
  `iac/terraform/aws/chat` module.
- **Reused (no breaking change)**: DynamoDB table + stream, `DynamoDbTableOperations` base,
  `NotificationService` + SQS push queue + `send-push-notification` + SNS, `UserService`, Cognito,
  logger/config libs.

## Data Flow Diagram (text)
```
[Donor accepts] -> acceptance row write -> [DDB Stream] -> chatChannelCreator -> [ChatChannel: OPEN]
[Seeker/Donor app] <--WSS--> [chatConnect/Send/Typing/MarkRead] <-> [ChatMessage/Connection items]
       send -> persist + broadcast -> (recipient offline?) -> [SQS push] -> [send-push-notification] -> [SNS] -> device deep-link
[Open room] -> REST getHistory -> [ChatMessage items] (newest-first)
[Donation COMPLETED] -> acceptance row update -> [DDB Stream] -> chatChannelCreator -> [ChatChannel: LOCKED]
```

## Risk / Coupling Notes
- **Stream coupling**: chatChannelCreator depends on the acceptance-row shape
  (`SK begins_with ACCEPTED#`, `status`). Low risk — shape is stable and documented in
  `docs/architecture/Database.rst`; consumer is additive (no change to producers).
- **Connection fan-out**: delivery requires querying a user's connections; isolated in
  ChatConnectionService so the access pattern can evolve without touching handlers.
- **Push reuse**: only additive (`CHAT_MESSAGE` + payload); existing notification types unaffected.
