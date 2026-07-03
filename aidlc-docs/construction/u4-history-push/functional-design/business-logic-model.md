# U4 History + Push — Business Logic Model

Two pieces: a REST **history** handler and the **CHAT_MESSAGE push** completion (publish-only).

## chatGetHistory (REST GET)
```
event = { requesterId (cognito sub), channelId, cursor?, limit? }
httpLogger = createHTTPLogger(requesterId, apiGwRequestId, cloudFrontRequestId)
channelService = new ChatChannelService(chatChannelOps, logger)
messageService = new ChatMessageService(chatMessageOps, logger)
decodedCursor = cursor ? decodeCursor(cursor) : undefined          # base64 JSON -> LastEvaluatedKey
limit = clamp(limit ?? 20, 1, 20)
page = await messageService.getHistory(channelId, requesterId, channelService, limit, decodedCursor)
        # getHistory enforces participant check (403) + newest-first
return generateApiGatewayResponse({
  success: true,
  data: { items: page.items, nextCursor: page.nextCursor ? encodeCursor(page.nextCursor) : null }
}, HTTP_CODES.OK)
# errors: ChatOperationError.errorCode mapped (404/403/400); else 500
```

## Cursor codec (pure)
```
encodeCursor(key) = base64( JSON.stringify(key) )
decodeCursor(s)   = JSON.parse( base64decode(s) )   # throws ChatValidation on malformed
```
- Round-trip: `decodeCursor(encodeCursor(k)) deepEquals k` (PBT-02).

## CHAT_MESSAGE push (publish-only) — change in NotificationService.sendPushNotification
```
... existing branches (BLOOD_REQ_POST / REQ_ACCEPTED|REQ_IGNORED) ...
else if (type === CHAT_MESSAGE):
    # do NOT persist a generic notification record (chat messages live in the chat tables)
    await publishNotification(notificationAttributes, cachedUserSnsEndpointArn, snsModel)
else:
    await createNotification(...); await publishNotification(...)   # unchanged COMMON path
```
- The enqueue side is already chat-specific (U3 `ChatPushNotifier` puts a `CHAT_MESSAGE`
  `NotificationAttributes` on the existing SQS queue); the existing `send-push-notification` Lambda
  consumes it and calls `sendPushNotification` → this new branch publishes via SNS.

## Deep-link contract (consumed by U5 mobile)
- `CHAT_MESSAGE` payload: `{ channelId, requestPostId, seekerId, donorId, senderId, messageId }`,
  `title = 'New message'`, `body = <preview>`. Mobile opens `ChatRoom(channelId)` on tap.

## Cross-cutting
- Validation (SECURITY-05): `channelId` composite, `cursor` decodes safely, `limit` clamped.
- Authz (SECURITY-08): participant check inside `getHistory`; Cognito-authenticated REST.
- Fail-closed (SECURITY-15); no message bodies in logs (SECURITY-03).
