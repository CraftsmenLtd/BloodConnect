# U5 Mobile Client — Logical Components

## Pure logic (testable outside React) — `clients/mobile/src/chatWorkflow/`
- **`chatQueue.ts`** — pure outbox reducer (`enqueue`/`ack`/dedup by `clientMessageId`).
- **`messageList.ts`** — pure merge/order reducer (append/prepend, dedup, unread).
- **`clientMessageId.ts`** — `generateClientMessageId()` (timestamp + random; no dep).
- **`ChatSocket.ts`** — WS client wrapper (connect/onEvent/send/close + backoff).
- **`chatApi.ts`** — REST calls (`getHistory`, `listChannels`) via `useFetchClient`.

## Hooks — `clients/mobile/src/chatWorkflow/hooks/`
- **`useChatInbox.ts`** — load/refresh channels + unread.
- **`useChatRoom.ts`** — orchestrates `ChatSocket` + queue + message-list + history + receipts/typing.

## Components / Screens — `clients/mobile/src/chatWorkflow/UI/`
- `ChatInbox.tsx`, `ChannelListItem.tsx`, `ChatRoom.tsx`, `ChatRoomHeader.tsx`, `MessageList.tsx`,
  `MessageBubble.tsx`, `MessageComposer.tsx`, `TypingIndicator.tsx`, `LockedBanner.tsx`.

## Integration points (existing)
- `setup/navigation` (routes/SCREENS) — add `CHAT_INBOX`/`CHAT_ROOM`.
- `setup/notification` — `CHAT_MESSAGE` deep-link → `ChatRoom`.
- `myActivity/donorTracking` + `myActivity` — "Chat" buttons.
- `setup/config` — `WEBSOCKET_URL`.

## Backend addition (U5-owned)
- `core/services/aws/chat/chatListChannels.ts` (REST) + `openapi/paths/chat/channels.json` +
  response schema — reuses U1 `ChatChannelService.listChannelsForUser` + U4 cursor helpers.

## Component Interaction (logical)
```
ChatInbox -> useChatInbox -> chatApi.listChannels (REST)
ChatRoom  -> useChatRoom  -> ChatSocket (WS) + chatQueue + messageList + chatApi.getHistory
push CHAT_MESSAGE -> deep-link -> ChatRoom(channelId)
```

## Deferred to U6
- `chatListChannels` route/integration Terraform + IAM; mobile WSS URL env wiring per environment.
