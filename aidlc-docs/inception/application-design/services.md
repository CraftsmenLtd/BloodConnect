# Services & Orchestration — Issue #571 (In-app Chat)

> How handlers orchestrate domain services. Mirrors the existing pattern where a thin Lambda builds
> services (with injected DynamoDB/SQS adapters) and delegates to domain logic.

## Service Inventory
| Service | Layer | Responsibility |
|---|---|---|
| ChatChannelService | domain | Channel lifecycle, inbox listing, participant assertion |
| ChatMessageService | domain | Messages, history, read receipts, unread, rate limit |
| ChatConnectionService | domain | WebSocket connection registry |
| RealtimeNotifier (port) | domain port → AWS adapter | Deliver events to connected clients |
| NotificationService (existing) | domain | Enqueue `CHAT_MESSAGE` push fallback |
| UserService (existing) | domain | Participant profile lookups |

## Orchestration Flow 1 — Channel auto-create / lock (stream)
```
DynamoDB write to acceptance row (PK=BLOOD_REQ#<seekerId>, SK begins_with ACCEPTED#)
  -> DynamoDB Stream (NEW_AND_OLD_IMAGES)
  -> chatChannelCreator (stream consumer)
       parse NewImage; derive (seekerId, requestPostId, donorId) + status
       if status == ACCEPTED:
           load request context (blood group/urgency/date/location)
           ChatChannelService.createChannelIfAbsent(...)   # idempotent (US-1)
       else if status == COMPLETED:
           ChatChannelService.lockChannel(channelId)        # OPEN->LOCKED (US-3)
       else (IGNORED / others): no-op                        # channel stays OPEN (Q6=C)
```
- Idempotency: duplicate/replayed records do not create duplicate channels (PBT-04).
- Fail-closed + partial-batch-failure reporting like `sendPushNotification` (SECURITY-15).

## Orchestration Flow 2 — Send message (WebSocket)
```
client -> WSS sendMessage {action, channelId, body, clientMessageId}
  -> chatSendMessage handler
       ChatMessageService.sendMessage(...):
         channel = ChatChannelService.getChannel(channelId)        # 404 if missing
         ChatChannelService.assertParticipant(channel, senderId)   # 403 (SECURITY-08, US-11)
         assert channel.status == OPEN                              # reject if LOCKED (US-3)
         validate body (<=2000, text/emoji)                        # SECURITY-05 (US-4)
         assertWithinRateLimit(channelId, senderId)                # 60/min (US-12)
         persist ChatMessageDTO (dedup by clientMessageId)         # PBT-04
         update channel.lastMessageAt/preview
         realtime.broadcastToChannel(MESSAGE, exclude=senderConn)  # US-4
         for each recipient: if !connections.isUserConnected -> NotificationService.sendNotification(CHAT_MESSAGE)  # FR-8 (US-10)
```

## Orchestration Flow 3 — Connect / disconnect / typing / read
```
$connect   -> chatAuthorizer (JWT from ?token=) -> chatConnect -> ChatConnectionService.registerConnection
$disconnect-> chatDisconnect -> ChatConnectionService.removeConnection(connectionId)
typing     -> chatTyping  -> realtime.broadcastToChannel(TYPING, exclude=self)     # ephemeral (US-7)
markRead   -> chatMarkRead-> ChatMessageService.markRead -> upsert lastReadAt; broadcast READ_RECEIPT  # US-8
```

## Orchestration Flow 4 — History (REST)
```
GET history?channelId&cursor (Cognito-auth)
  -> chatGetHistory handler
       ChatChannelService.assertParticipant(channel, requesterId)  # 403 (SECURITY-08)
       ChatMessageService.getHistory(channelId, cursor)            # newest-first, size 20 (US-5)
```

## Cross-cutting
- **Auth**: WebSocket via Lambda authorizer (Cognito JWT in `?token=`); REST via existing Cognito
  integration. Token validated server-side every request (SECURITY-08).
- **Logging**: structured logs with correlation IDs; never log message `body`, tokens, or phone
  numbers (SECURITY-03).
- **Rate limiting**: server-side per channel (SECURITY-11 / NFR-3), reusing the repo's
  `ThrottlingError` shape.
- **Push reuse**: `CHAT_MESSAGE` flows through the existing SQS queue + `send-push-notification`
  Lambda + SNS (FR-8).
