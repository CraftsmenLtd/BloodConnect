# U5 Mobile Client — Code Generation Summary

**Status**: Core generated & verified. **Tests**: 18 passing (mobile-core 15 + backend `chatListChannels` 3;
chat suite total now ~106). **Type-check**: no errors in any new chat file. **ESLint**: clean (mobile
source + tests). **New deps**: none.

## Backend addition (U5-owned)
- `core/services/aws/chat/chatListChannels.ts` (REST; reuses `listChannelsForUser` + cursor helpers).
- `core/application/chatWorkflow/Types.ts` — `GetChatChannelsEvent`.
- OpenAPI `openapi/paths/chat/channels.json` + `openapi/components/schemas/chat/channels-response.json`.
- Test `core/services/aws/tests/chat/chatListChannels.test.ts` (success/nextCursor/400-cursor).

## Mobile — pure logic (`clients/mobile/src/chatWorkflow/`)
- `types.ts`, `clientMessageId.ts`, `chatQueue.ts` (outbox; dedup) — *pre-existing from an earlier pass*.
- `messageList.ts` (order/merge/unread), `ChatSocket.ts` (WS wrapper, injectable, backoff), `chatApi.ts`
  (`fetchHistory`/`fetchChannels`).

## Mobile — hooks (`.../hooks/`)
- `useChatInbox.ts`, `useChatRoom.ts` (ChatSocket + queue + messageList + history + typing/receipts +
  AsyncStorage offline queue + optimistic send).

## Mobile — UI (`.../UI/`)
- `MessageBubble`, `MessageList`, `MessageComposer`, `TypingIndicator`, `LockedBanner`,
  `ChatRoomHeader`, `ChannelListItem`, `ChatInbox`, `ChatRoom` (presentational; `testID`s; 2000-char cap).

## Integration (existing files)
- `setup/constant/screens.ts` — `CHAT_INBOX` / `CHAT_ROOM` added.
- `setup/config/chat.ts` — `WEBSOCKET_URL` config (via `expo-constants`).

## Tests (mobile-core)
- `chatQueue.test.ts` (PBT dedup/uniqueness), `messageList.test.ts` (PBT ordering + unread≥0 + echo
  replacement), `ChatSocket.test.ts` (token-in-url, send open/closed, dispatch/ignore-malformed, close),
  `chatApi.test.ts` (buildQuery, fetchHistory/fetchChannels).

## ⛔ Remaining integration wiring (needs the app's auth/fetch providers — best done with the app running)
- Register `ChatInbox`/`ChatRoom` in `setup/navigation/routes.ts` + `navigationTypes.ts` via **wrapper
  screens** that read route params and inject the **auth token** + a **`ChatApiClient` adapter** over
  the app's `useFetchClient` + `chatConfig.websocketUrl` + current `userId`.
- `setup/notification/*` — route a `CHAT_MESSAGE` push (payload `channelId`) → `ChatRoom`.
- "Chat" buttons on the seeker `myActivity/donorTracking` accepted-donor card + donor `myActivity` card.
- (Optional) `useChatRoom`/`useChatInbox` hook tests via `@testing-library/react-native` (the composed
  pure core is already PBT-tested; `ChatSocket`/`chatApi` are unit-tested).

## Extension compliance
- **PBT**: PBT-04 (queue dedup/exactly-once), PBT-03 (ordering + unread≥0), PBT-10 (example + property). ✅
- **Security**: SECURITY-05 (composer cap), -08 (token on connect, server identity), -03/-01 (no token
  logs, WSS). ✅

## Story coverage
US-5 (history), US-6 (offline queue), US-9 (inbox + unread), US-7/US-8 (typing/receipts UI), US-3 UI
(locked banner). US-10/US-13/US-14 depend on the remaining navigation/notification wiring above.
