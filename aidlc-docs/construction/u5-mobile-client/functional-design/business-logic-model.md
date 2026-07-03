# U5 Mobile Client — Business Logic Model

Mobile (React Native/Expo) chat UX over U3 (WebSocket) + U4 (history/push) + the new
`chatListChannels` REST endpoint. Follows the repo's `useFetchClient`/`useFetchData` hook pattern and
react-navigation `routes`/`SCREENS`.

## Backend addition (U5-owned dependency)
- `chatListChannels` REST handler (`core/services/aws/chat/chatListChannels.ts`) →
  `ChatChannelService.listChannelsForUser(requesterId, limit, cursor)`; `requesterId` from Cognito
  `sub`; returns `{ items: ChannelMembershipDTO[], nextCursor }`. OpenAPI `paths/chat/channels.json`.

## useChatInbox (hook)
```
load(): GET /chat/channels -> channels[]; for visible channels, derive unread (from membership.lastReadAt
         + a lightweight count, or a server-provided unreadCount if added)
state: { channels, isLoading, error, refresh() }
```

## useChatRoom (hook) — WebSocket lifecycle + offline queue
```
connect(): ws = new WebSocket(`${WEBSOCKET_URL}?token=${cognitoToken}`)
  onopen:    flushOfflineQueue(); markRead()
  onmessage: dispatch ChatRealtimeEvent -> append MESSAGE / set TYPING / apply READ_RECEIPT
  onclose/onerror: scheduleReconnect(backoff)
send(text):
  msg = { clientMessageId: uuid(), body: text }
  optimisticallyAppend(msg, status='sending')
  if ws.open: ws.send({action:'sendMessage', channelId, body, clientMessageId})
  else:       enqueueOffline(msg)
history(): GET /chat/history?channelId&cursor -> prepend older page (newest-first)
typing():  throttled ws.send({action:'typing', channelId})
markRead(): ws.send({action:'markRead', channelId})
state: { messages, isConnected, isOtherTyping, otherLastReadAt, loadOlder(), send(), error }
```

## Offline queue
```
enqueueOffline(msg): AsyncStorage append under key `chatQueue:${channelId}`
flushOfflineQueue(): read queue -> for each in order: ws.send(...) -> on ack/echo remove from queue
                     (server dedup by clientMessageId makes re-sends safe)
```

## Message status model (optimistic UI)
`sending` -> `sent` (server echo) -> `delivered`/`read` (receipts). Queued offline = `queued`.

## Deep-link (setup/notification)
```
on CHAT_MESSAGE push tap: payload.channelId -> navigate(CHAT_ROOM, { channelId })
```

## Entry points
- Seeker `myActivity/donorTracking` accepted-donor card → "Chat" → `ChatRoom({ channelId: requestPostId#donorId })`.
- Donor `myActivity` active-donation card → "Chat" → `ChatRoom`.

## Locked channel
- If channel `status === LOCKED`, `ChatRoom` shows the read-only banner and disables the composer.
