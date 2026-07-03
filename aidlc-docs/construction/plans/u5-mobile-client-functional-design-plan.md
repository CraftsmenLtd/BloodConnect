# U5 Mobile Client — Functional Design Plan

> Answers pre-filled with recommendations per the user's standing instruction.

### Q-1 — BACKEND GAP: inbox "list my channels" endpoint
[Answer]: The inbox (US-9) needs to list the current user's channels. U1 has
`ChatChannelService.listChannelsForUser` but **no REST handler exists**. **Recommendation**: add a
small `chatListChannels` REST handler (mirrors `chatGetHistory`: Cognito `requesterId`, cursor) +
OpenAPI path — owned by **U5** as its backend dependency (it's the only consumer). Flagged for approval.

### Q-2 — Screens
[Answer]: `ChatInbox` (list channels: preview + unread badge), `ChatRoom` (message list, sent/received
bubbles, composer, locked banner), `ChatRoomHeader` (blood-request context from the channel snapshot).

### Q-3 — Hooks
[Answer]: `useChatInbox` (REST list + unread), `useChatRoom` (WebSocket connect/send/receive, typing,
read receipts, history pagination via REST, **offline queue** with `clientMessageId`).

### Q-4 — Real-time client
[Answer]: React Native global `WebSocket` to the API GW WSS URL with `?token=<cognito token>`; reconnect
with backoff; flush the offline queue on (re)connect. Inbound events = U1 `ChatRealtimeEvent`.

### Q-5 — Offline queue
[Answer]: Persist unsent messages (with `clientMessageId`) in AsyncStorage; on reconnect, resend in
order; server dedup (U1) guarantees exactly-once. Optimistic UI: show queued messages immediately.

### Q-6 — Navigation + deep-link
[Answer]: Add `CHAT_INBOX` / `CHAT_ROOM` to `SCREENS` + `routes`; `ChatRoom` takes `{ channelId, context }`.
Extend `setup/notification` to route a `CHAT_MESSAGE` push (payload `channelId`) → `ChatRoom`.

### Q-7 — Entry points
[Answer]: "Chat" button on the seeker's accepted-donor card (`myActivity/donorTracking`) and on the
donor's active-donation card (`myActivity`), navigating to `ChatRoom`.

### Q-8 — Config
[Answer]: Add `WEBSOCKET_URL` (+ reuse API base URL) to the mobile env/config.

## Checklist
- [x] business-logic-model.md (hooks state machines + WS lifecycle + offline queue + deep-link)
- [x] business-rules.md
- [x] frontend-components.md (component hierarchy, props/state, interactions, API integration, testids)
