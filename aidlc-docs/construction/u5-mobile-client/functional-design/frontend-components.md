# U5 Mobile Client — Frontend Components

> React Native/Expo. Automation-friendly `data-testid`/`testID` on interactive elements
> (`{component}-{role}`). Follows existing `clients/mobile/src` conventions (TS, hooks, react-navigation).

## Component Hierarchy
```
ChatInbox (screen)
  └─ ChannelListItem[] (preview, unread badge)        -> navigate ChatRoom
ChatRoom (screen)
  ├─ ChatRoomHeader (blood-group, urgency, date, location)
  ├─ MessageList
  │    └─ MessageBubble[] (sent | received; status; timestamp)
  ├─ TypingIndicator (conditional)
  ├─ LockedBanner (conditional, when status=LOCKED)
  └─ MessageComposer (TextInput + Send) (hidden/disabled when locked)
```

## Props / State
- **ChatInbox**: state from `useChatInbox` → `{ channels, isLoading, error, refresh }`.
- **ChatRoom**: route params `{ channelId, context? }`; state from `useChatRoom` →
  `{ messages, isConnected, isOtherTyping, otherLastReadAt, send, loadOlder, isLocked, error }`.
- **ChatRoomHeader**: props `{ context: ChatChannelContext }`.
- **MessageBubble**: props `{ message, isMine, status }`.
- **ChannelListItem**: props `{ channel, unreadCount, onPress }`.

## User Interaction Flows
- Open inbox → tap channel → `ChatRoom` → messages load (history) + WS connects → type → Send.
- Receive while open → bubble appends; while backgrounded/offline → push → tap → deep-link to room.
- Offline send → optimistic `queued` bubble → reconnect → delivered.

## Form Validation
- Composer: non-empty after trim, ≤ 2000 chars; Send disabled otherwise.

## API Integration
- `useChatInbox` → `GET /chat/channels` (new, U5 backend addition).
- `useChatRoom` → `GET /chat/history` (U4) + WebSocket routes `sendMessage`/`typing`/`markRead` (U3).

## data-testid / testID
- `chat-inbox-list`, `chat-inbox-item-<channelId>`, `chat-room-message-list`,
  `chat-room-message-<messageId>`, `chat-room-composer-input`, `chat-room-send-button`,
  `chat-room-locked-banner`, `donor-tracking-chat-button`, `my-activity-chat-button`.

## New navigation
- `SCREENS.CHAT_INBOX`, `SCREENS.CHAT_ROOM` + `routes` entries (header shows the other participant /
  request context); deep-link mapping for `CHAT_MESSAGE`.

## New config
- `WEBSOCKET_URL` (mobile env) for the WSS endpoint.
