# Components — Issue #571 (In-app Chat)

> High-level component identification and interfaces. Detailed business rules and exact DynamoDB key
> schemas are deferred to per-unit **Functional Design**. Components follow the repo's hexagonal
> pattern: **handler → domain service → repository/port interface → AWS adapter**.

## A. Shared Contracts (`commons/dto`)

### A1. ChatChannelDTO (new)
- **Purpose**: A 1:1 conversation scoped to `(seekerId, requestPostId, donorId)`.
- **Key fields**: `channelId`, `seekerId`, `requestPostId`, `donorId`, `status` (`OPEN | LOCKED`),
  `context` (blood group, urgency, donationDateTime, location — snapshot), `lastMessageAt`,
  `lastMessagePreview`, `createdAt`, `ttl`.

### A2. ChatMessageDTO (new)
- **Purpose**: A single message within a channel.
- **Key fields**: `channelId`, `messageId`, `clientMessageId`, `senderId`, `body` (Unicode/emoji),
  `sentAt`, `ttl`.

### A3. ChatConnectionDTO (new)
- **Purpose**: An active WebSocket connection for a user.
- **Key fields**: `connectionId`, `userId`, `connectedAt`, `ttl`.

### A4. Enums / types (new)
- `ChatChannelStatus` = `OPEN | LOCKED`.
- WebSocket event envelope types: `MESSAGE | TYPING | READ_RECEIPT` (outbound to clients).
- `ChatReadStateDTO` (or fields on channel membership): `userId`, `channelId`, `lastReadAt`.

### A5. NotificationType extension (existing enum)
- Add `CHAT_MESSAGE` to `commons/dto/NotificationDTO.ts` `NotificationType`.

## B. Domain Services (`core/application/chatWorkflow`)

### B1. ChatChannelService
- **Responsibility**: Channel lifecycle — idempotent creation, locking, retrieval, inbox listing.
- **Interface (high-level)**: `createChannelIfAbsent`, `lockChannel`, `getChannel`,
  `listChannelsForUser`, `assertParticipant`.

### B2. ChatMessageService
- **Responsibility**: Persist/retrieve messages; read receipts; unread count; enforce rate limit
  and channel-open + participant rules.
- **Interface**: `sendMessage`, `getHistory`, `markRead`, `getUnreadCount`, `assertWithinRateLimit`.

### B3. ChatConnectionService
- **Responsibility**: Track WebSocket connections; resolve a user's active connections.
- **Interface**: `registerConnection`, `removeConnection`, `getConnectionsForUser`,
  `isUserConnected`.

### C. Ports (interfaces in `core/application/models` / `chatWorkflow`)
- **ChatChannelRepository**, **ChatMessageRepository**, **ChatConnectionRepository** — persistence
  ports (mirroring `AcceptDonationRepository`).
- **RealtimeNotifier** — delivery port: `postToConnections(connectionIds, payload)`,
  `broadcastToChannel(channel, payload, excludeConnectionId?)`; cleans up stale connections.
- **QueueModel** (existing) — reused to enqueue `CHAT_MESSAGE` push fallback.

## D. AWS Adapters (`core/services/aws`)

### D1. Lambda handlers (`core/services/aws/chat`)
- **chatAuthorizer** — WebSocket REQUEST authorizer; validates Cognito JWT from `?token=`.
- **chatConnect** — `$connect`; stores `ChatConnectionDTO`.
- **chatDisconnect** — `$disconnect`; removes connection by `connectionId`.
- **chatSendMessage** — `sendMessage` route; orchestrates persist → realtime broadcast → push fallback.
- **chatTyping** — `typing` route; ephemeral broadcast (no persistence).
- **chatMarkRead** — `markRead` route; updates `lastReadAt`, broadcasts `READ_RECEIPT`.
- **chatChannelCreator** — DynamoDB **stream** consumer; create on `ACCEPTED`, lock on `COMPLETED`.
- **chatGetHistory** — REST handler; paginated newest-first history (participant-authorized).

### D2. DynamoDB operations + key models (`core/services/aws/commons`)
- **ChatChannelModel** + **ChatChannelDynamoDbOperations** (implements ChatChannelRepository).
- **ChatMessageModel** + **ChatMessageDynamoDbOperations** (implements ChatMessageRepository).
- **ChatConnectionModel** + **ChatConnectionDynamoDbOperations** (implements ChatConnectionRepository).
- Key prefixes (final schema in Functional Design U1): `CHAT_CHANNEL#`, `CHAT_MSG#`, `CHAT_CONN#`,
  inbox membership via overloaded `GSI1`.

### D3. Realtime adapter
- **ApiGatewayManagementApiOperations** (implements RealtimeNotifier) — `@aws-sdk/client-apigatewaymanagementapi`; handles `GoneException` → delete stale connection.

### D4. Reused adapters
- **UserService** / **UserDynamoDbOperations** — participant profiles for push titles.
- **SQSOperations** — enqueue push fallback.
- Existing **logger** (`ServiceLogger` / `HttpLogger`) — structured logging (SECURITY-03; no PII).

## E. Mobile Client (`clients/mobile/src`)
- **Screens**: `ChatInbox`, `ChatRoom`, `ChatRoomHeader`.
- **Hooks**: `useChatInbox`, `useChatRoom` (WebSocket connect, send, receive, typing, receipts,
  offline queue with `clientMessageId`).
- **Entry points**: "Chat" button in `myActivity/donorTracking` (seeker) and donor `myActivity` card.
- **Navigation**: new `ChatInbox` / `ChatRoom` routes in `setup/navigation`.
- **Notification**: handle `CHAT_MESSAGE` deep-link in `setup/notification`.

## Component → Requirement / Story Coverage
| Component | Requirements | Stories |
|---|---|---|
| ChatChannelService + chatChannelCreator | FR-1, FR-7 | US-1, US-2, US-3 |
| ChatMessageService + chatSendMessage | FR-3, FR-9, NFR-3 | US-4, US-7, US-8, US-9, US-12 |
| chatGetHistory | FR-4 | US-5 |
| ChatConnectionService + chatConnect/Disconnect + chatAuthorizer | FR-2, NFR-1 | US-11 |
| RealtimeNotifier + ApiGatewayManagementApiOperations | FR-3, FR-9 | US-4, US-7, US-8 |
| Push fallback (QueueModel + CHAT_MESSAGE) | FR-8 | US-10 |
| Mobile screens/hooks | FR-5, FR-6 | US-5, US-6, US-9, US-13, US-14 |
