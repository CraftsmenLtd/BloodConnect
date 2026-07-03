# Component Methods — Issue #571 (In-app Chat)

> High-level method signatures and I/O. **Detailed business rules, validation specifics, and exact
> key schemas are defined in per-unit Functional Design.** Types are indicative TypeScript.

## ChatChannelService (`core/application/chatWorkflow/ChatChannelService.ts`)
```ts
createChannelIfAbsent(input: {
  seekerId: string; requestPostId: string; donorId: string; context: ChatChannelContext
}): Promise<ChatChannelDTO>            // idempotent (US-1); no-op if channel exists
lockChannel(channelId: string): Promise<void>                 // OPEN -> LOCKED (US-3)
getChannel(channelId: string): Promise<ChatChannelDTO | null>
listChannelsForUser(userId: string, page?: Cursor): Promise<Paginated<ChatChannelDTO>>  // inbox (US-9)
assertParticipant(channel: ChatChannelDTO, userId: string): void   // throws 403 if not (SECURITY-08)
```

## ChatMessageService (`core/application/chatWorkflow/ChatMessageService.ts`)
```ts
sendMessage(input: {
  channelId: string; senderId: string; body: string; clientMessageId: string
}, realtime: RealtimeNotifier, connections: ChatConnectionService,
   queue: QueueModel, pushQueueUrl: string): Promise<ChatMessageDTO>
// validates: channel OPEN, sender is participant, body length<=2000 & text (SECURITY-05),
// rate limit 60/min (NFR-3); persists; broadcasts MESSAGE; push fallback if recipient offline (FR-8)

getHistory(channelId: string, requesterId: string, page?: Cursor)
  : Promise<Paginated<ChatMessageDTO>>        // newest-first, size 20 (FR-4); participant-checked

markRead(channelId: string, userId: string, realtime: RealtimeNotifier,
         connections: ChatConnectionService): Promise<void>   // updates lastReadAt; broadcasts READ_RECEIPT (US-8)

getUnreadCount(channelId: string, userId: string): Promise<number>   // >= 0 invariant (US-9)
assertWithinRateLimit(channelId: string, senderId: string): Promise<void>   // throws ThrottlingError (US-12)
```

## ChatConnectionService (`core/application/chatWorkflow/ChatConnectionService.ts`)
```ts
registerConnection(connectionId: string, userId: string): Promise<void>     // $connect (FR-2)
removeConnection(connectionId: string): Promise<void>                       // $disconnect (FR-2)
getConnectionsForUser(userId: string): Promise<string[]>                    // active connectionIds
isUserConnected(userId: string): Promise<boolean>                           // drives push fallback (FR-8)
```

## Ports

### Repositories (interfaces)
```ts
// ChatChannelRepository
create(channel): Promise<void>; getById(channelId): Promise<ChatChannelDTO|null>;
updateStatus(channelId, status): Promise<void>; updateLastMessage(channelId, preview, at): Promise<void>;
queryByUser(userId, page?): Promise<Paginated<ChatChannelDTO>>;
upsertReadState(channelId, userId, lastReadAt): Promise<void>; getReadState(channelId, userId): Promise<string|null>

// ChatMessageRepository
create(message): Promise<void>; queryByChannel(channelId, page?): Promise<Paginated<ChatMessageDTO>>;
countSince(channelId, sinceIso): Promise<number>

// ChatConnectionRepository
create(connection): Promise<void>; deleteByConnectionId(connectionId): Promise<void>;
queryByUser(userId): Promise<ChatConnectionDTO[]>
```

### RealtimeNotifier (port)
```ts
postToConnections(connectionIds: string[], payload: ChatRealtimeEvent): Promise<void>
broadcastToChannel(channel: ChatChannelDTO, payload: ChatRealtimeEvent,
                   connections: ChatConnectionService, excludeConnectionId?: string): Promise<void>
// implementation deletes connections that return GoneException (NFR-4)
```

## Handlers (adapters — thin)

```ts
// chatAuthorizer(event): APIGatewayAuthorizerResult     // validate Cognito JWT from ?token=
// chatConnect(event): { statusCode }                    // registerConnection
// chatDisconnect(event): { statusCode }                 // removeConnection
// chatSendMessage(event): { statusCode }                // ChatMessageService.sendMessage(...)
// chatTyping(event): { statusCode }                     // realtime.broadcastToChannel(TYPING)
// chatMarkRead(event): { statusCode }                   // ChatMessageService.markRead(...)
// chatChannelCreator(event: DynamoDBStreamEvent): void  // ACCEPTED->createChannelIfAbsent; COMPLETED->lockChannel
// chatGetHistory(event): APIGatewayProxyResult          // ChatMessageService.getHistory(...)
```

## Property-based test hooks (PBT-01, carried to Functional Design / Code Generation)
- **Round-trip**: DTO ↔ DynamoDB item (`fromDto`/`toDto`) for all three chat models; channel-key
  build ↔ parse.
- **Invariant**: `getHistory` always newest-first; `getUnreadCount` ≥ 0; `body.length` ≤ 2000.
- **Idempotence**: `createChannelIfAbsent` (duplicate stream events); message create by
  `clientMessageId`.
- **Stateful**: channel state machine `OPEN → LOCKED` (no reverse; no send when LOCKED); unread
  count under interleaved send/markRead command sequences.
