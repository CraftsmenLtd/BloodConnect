# U3 Real-time Messaging — Business Logic Model

WebSocket handlers (adapters) + two port implementations (`RealtimeNotifier`, `OfflineNotifier`).
Reuses U1 `ChatMessageService` / `ChatChannelService` / `ChatConnectionService`.

## chatAuthorizer ($connect REQUEST authorizer)
```
token = event.queryStringParameters?.token
if !token -> Deny (or throw 'Unauthorized')
claims = await cognitoVerifier.verify(token)         # aws-jwt-verify; throws on invalid/expired
return { principalId: claims.sub, context: { userId: claims.sub }, policyDocument: Allow }
```
- Unauthenticated/invalid → `403` (no connection stored).

## chatConnect ($connect)
```
userId = event.requestContext.authorizer?.userId
connectionId = event.requestContext.connectionId
await chatConnectionService.registerConnection(connectionId, userId)
return { statusCode: 200 }
```

## chatDisconnect ($disconnect)
```
await chatConnectionService.removeConnection(event.requestContext.connectionId)
return { statusCode: 200 }
```

## chatSendMessage (route: action='sendMessage')
```
connectionId = event.requestContext.connectionId
senderId = await chatConnectionService.getConnectionUser(connectionId)   # 403 if not found
{ channelId, body, clientMessageId } = JSON.parse(event.body)
realtime = new ApiGatewayManagementApiOperations(endpoint, region)
offline  = new ChatPushNotifier(notificationService, queue, pushQueueUrl)
await chatMessageService.sendMessage(
  { channelId, senderId, body, clientMessageId },
  chatChannelService, chatConnectionService, realtime, offline)
return { statusCode: 200 }
# errors mapped to status codes; fail-closed
```

## chatTyping (route: action='typing')
```
senderId = getConnectionUser(connectionId)
channel  = chatChannelService.getChannel(channelId); assertParticipant(channel, senderId)
otherId  = otherParticipant(channel, senderId)
conns    = chatConnectionService.getConnectionsForUser(otherId)
realtime.postToConnections(conns, { type: TYPING, channelId, userId: senderId })   # ephemeral
cleanup stale
```

## chatMarkRead (route: action='markRead')
```
userId = getConnectionUser(connectionId)
await chatMessageService.markRead(channelId, userId, chatChannelService, chatConnectionService, realtime)
```

## RealtimeNotifier impl — ApiGatewayManagementApiOperations
```
postToConnections(connectionIds, event):
  staleConnectionIds = []
  for id in connectionIds:
    try: PostToConnectionCommand({ ConnectionId: id, Data: JSON.stringify(event) })
    catch e: if e.name == 'GoneException' -> staleConnectionIds.push(id)
             else log + continue
  return { staleConnectionIds }
```
- The endpoint is built from `https://${domainName}/${stage}` (per-request) or `WEBSOCKET_ENDPOINT` env.

## OfflineNotifier impl — ChatPushNotifier (push fallback backend)
```
notifyNewMessage(recipientId, channel, message):
  notificationService.sendNotification({
    userId: recipientId, type: CHAT_MESSAGE,
    title: 'New message', body: messagePreview,
    payload: { channelId: channel.channelId, requestPostId: channel.requestPostId, ... }
  }, queue, pushQueueUrl)
```
- Reuses the existing SQS push queue → `send-push-notification` → SNS. **Payload shaping for the
  mobile deep-link + mobile consumption are U4.**

## Cross-cutting
- **Validation** (SECURITY-05): parse/validate the WS frame (action, channelId, body length, ids)
  before processing; reject malformed frames.
- **Rate limit / participant / locked-channel** rules are enforced inside `ChatMessageService`
  (U1) — U3 just wires the adapters.
- **Fail-closed** (SECURITY-15): every handler try/catch; generic client responses; structured logs
  without message bodies/tokens (SECURITY-03).
