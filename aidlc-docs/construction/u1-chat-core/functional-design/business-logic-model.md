# U1 Chat Core — Business Logic Model

> Technology-agnostic operations for the three domain services + ports. Algorithms reference the
> entities/keys in `domain-entities.md`. No AWS specifics (those live in adapters / U6 infra).

## ChatChannelService

### createChannelIfAbsent(seekerId, requestPostId, donorId, context) → ChatChannelDTO
```
channelId = `${requestPostId}#${donorId}`
attempt conditional create of META item (attribute_not_exists(PK)):
    status = OPEN, context = snapshot, createdAt = now, ttl = now + 90d
if condition fails (already exists):
    return existing channel            # idempotent (US-1, PBT-04)
else:
    create 2 membership items (seeker role=SEEKER, donor role=DONOR), GSI1SK = createdAt#channelId
    return created channel
```

### lockChannel(channelId)
```
update META.status: OPEN -> LOCKED        # condition status == OPEN (no-op if already LOCKED)
# LOCKED is terminal; never transition back
```

### getChannel(channelId) → ChatChannelDTO | null
### listChannelsForUser(userId, cursor?) → Paginated<channel-membership view>
```
query GSI1 (GSI1PK = CHAT_USER#userId), ScanIndexForward=false, Limit=N, ExclusiveStartKey=cursor
```
### assertParticipant(channel, userId)
```
if userId not in {channel.seekerId, channel.donorId}: throw Forbidden(403)   # SECURITY-08
```

## ChatMessageService

### sendMessage(channelId, senderId, body, clientMessageId, realtime, connections, queue, pushQueueUrl) → ChatMessageDTO
```
channel = ChatChannelService.getChannel(channelId)
if channel == null: throw NotFound(404)
assertParticipant(channel, senderId)                      # 403 (SECURITY-08)
if channel.status != OPEN: throw Conflict('channel locked')   # US-3
validateBody(body)                                        # BR-5 (SECURITY-05)
assertWithinRateLimit(channelId, senderId)                # 60/min (US-12)

messageId = ULID(); sentAt = now; ttl = now + 90d
TransactWrite:
    Put message item (PK=CHAT_MSG#channelId, SK=MSG#sentAt#messageId)
    Put dedup guard (SK=DEDUP#clientMessageId, condition attribute_not_exists)
on dedup condition failure:
    return existing message for (channelId, clientMessageId)   # PBT-04

update both membership items: lastMessageAt=sentAt, lastMessagePreview=preview(body), GSI1SK=sentAt#channelId
realtime.broadcastToChannel(channel, {type: MESSAGE, message}, exclude=senderConnection)   # US-4
recipientId = otherParticipant(channel, senderId)
if not connections.isUserConnected(recipientId):
    queue.sendNotification(CHAT_MESSAGE payload deep-linking channelId)   # FR-8 (US-10)  [in U3/U4]
return message
```

### getHistory(channelId, requesterId, cursor?) → Paginated<ChatMessageDTO>
```
assertParticipant(getChannel(channelId), requesterId)     # 403
query PK=CHAT_MSG#channelId, SK begins_with MSG#, ScanIndexForward=false, Limit=20, start=cursor
return { items, nextCursor }                              # newest-first (US-5)
```

### markRead(channelId, userId, realtime, connections)
```
assertParticipant; lastReadAt_new = now
update membership(userId).lastReadAt = max(existing, now)  # monotonic (BR-8)
realtime.broadcastToChannel(channel, {type: READ_RECEIPT, userId, at}, ...)   # US-8
```

### getUnreadCount(channelId, userId) → number
```
lastReadAt = membership(userId).lastReadAt ?? epoch0
return countMessages(channelId where sentAt > lastReadAt AND senderId != userId)   # >= 0 (US-9)
```

### assertWithinRateLimit(channelId, senderId)
```
bucket = floor(now to minute)
count = atomicAdd(CHAT_RATE#channelId#senderId, MIN#bucket, +1, ttl=120s)
if count > 60: throw ThrottlingError                      # US-12 (mirrors repo ThrottlingError)
```

## ChatConnectionService
```
registerConnection(connectionId, userId): put CHAT_CONN# item, ttl=2h
removeConnection(connectionId): delete PK=CHAT_CONN#connectionId, SK=META
getConnectionsForUser(userId): query GSI1 (CHAT_CONN_USER#userId) -> connectionIds
isUserConnected(userId): getConnectionsForUser(userId).length > 0
```

## RealtimeNotifier (port semantics)
```
broadcastToChannel(channel, payload, connections, exclude?):
    recipients = {channel.seekerId, channel.donorId}
    connIds = flatMap(recipients, connections.getConnectionsForUser) minus exclude
    postToConnections(connIds, payload)
postToConnections(connIds, payload):
    for each connId: post; on GoneException -> ChatConnectionService.removeConnection(connId)  # NFR-4
```

## Data Flow Summary
```
create: stream/ACCEPTED -> createChannelIfAbsent -> META + 2 membership (U2 invokes; U1 provides)
send:   validate -> Transact(message + dedup) -> update memberships -> broadcast -> push-if-offline
read:   markRead -> membership.lastReadAt -> broadcast READ_RECEIPT
inbox:  listChannelsForUser (GSI1 recency) + getUnreadCount per channel
history:getHistory (reverse scan, paginated)
```

## Error Handling (fail-closed — SECURITY-15)
- Not found → 404; non-participant → 403; locked channel → 409; invalid body → 400; rate exceeded →
  429-style ThrottlingError. All external calls wrapped; errors surface generic messages to clients,
  detailed context only to structured logs (no PII/body/token — SECURITY-03).
