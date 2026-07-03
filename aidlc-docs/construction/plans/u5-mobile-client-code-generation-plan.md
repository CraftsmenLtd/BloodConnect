# U5 Mobile Client — Code Generation Plan (single source of truth)

**Unit**: U5 Mobile Client (+ `chatListChannels` backend addition). **Stories**: US-5, US-6, US-9,
US-13, US-14 (+ US-7/US-8/US-10 UI). **Depends on**: U3 (WS), U4 (history/push). **Conventions**: TS
strict, no `any`; mobile follows `clients/mobile/src` patterns (hooks, react-navigation, RN components,
`testID`). **Verification note**: the mobile workspace has pre-existing type errors; U5 verifies via the
new chat tests + lint + no-new-errors-in-chat-files.

---

## Step 1 — Backend addition: list channels
- [x] **CREATE** `core/services/aws/chat/chatListChannels.ts` — REST handler →
  `ChatChannelService.listChannelsForUser(requesterId, clampLimit(limit), decodeCursor(cursor))`;
  encode `nextCursor`; REST envelope; error mapping.
- [x] **CREATE** `openapi/paths/chat/channels.json` + `openapi/components/schemas/chat/channels-response.json`.
- [x] **CREATE** `core/services/aws/tests/chat/chatListChannels.test.ts` (success/nextCursor; 400 cursor).

## Step 2 — Mobile pure logic (`clients/mobile/src/chatWorkflow/`)
- [x] **CREATE** `types.ts` (mobile chat types: `ChatMessageView`, `MessageStatus`, `ChannelSummary`).
- [x] **CREATE** `clientMessageId.ts` (`generateClientMessageId()`).
- [x] **CREATE** `chatQueue.ts` (pure outbox reducer: `enqueue`/`ack`/dedup by `clientMessageId`).
- [x] **CREATE** `messageList.ts` (pure merge/order reducer: append/prepend/dedup; unread count).
- [x] **CREATE** `ChatSocket.ts` (WS wrapper: connect/onEvent/send/close + backoff; injectable).
- [x] **CREATE** `chatApi.ts` (`getHistory`, `listChannels` via the fetch client).

## Step 3 — Mobile hooks (`clients/mobile/src/chatWorkflow/hooks/`)
- [x] **CREATE** `useChatInbox.ts` (load/refresh channels).
- [x] **CREATE** `useChatRoom.ts` (ChatSocket + queue + messageList + history + typing/receipts;
  offline queue via AsyncStorage).

## Step 4 — Mobile UI (`clients/mobile/src/chatWorkflow/UI/`)
- [x] **CREATE** `ChatInbox.tsx`, `ChannelListItem.tsx`, `ChatRoom.tsx`, `ChatRoomHeader.tsx`,
  `MessageList.tsx`, `MessageBubble.tsx`, `MessageComposer.tsx`, `TypingIndicator.tsx`,
  `LockedBanner.tsx` (presentational; `testID`s).

## Step 5 — Integration edits (existing files)
- [~] **PARTIAL** `setup/constant/screens.ts` (+`CHAT_INBOX`/`CHAT_ROOM`) DONE; `routes.ts` + `navigationTypes.ts` registration (wrapper screens + provider glue) REMAINING.
- [~] **REMAINING** `setup/notification/*` — `CHAT_MESSAGE` deep-link → `ChatRoom`.
- [~] **REMAINING** seeker `donorTracking` + donor `myActivity` "Chat" buttons.
- [x] **DONE** `setup/config/chat.ts` — `WEBSOCKET_URL`.

## Step 6 — Tests (mobile + backend)
- [x] **CREATE** `clients/mobile/__tests__/chatWorkflow/chatQueue.test.ts` (PBT: dedup/exactly-once).
- [x] **CREATE** `clients/mobile/__tests__/chatWorkflow/messageList.test.ts` (PBT: ordering, unread≥0).
- [~] **DEFERRED** `useChatRoom.test.tsx` (composed core PBT-tested; ChatSocket/chatApi unit-tested instead).
- [~] **DEFERRED** `useChatInbox.test.tsx`.

## Step 7 — Documentation
- [x] **CREATE** `aidlc-docs/construction/u5-mobile-client/code/u5-code-summary.md`.

---

## Story Traceability
| Story | Implemented by (U5) |
|---|---|
| US-5 | useChatRoom history + MessageList |
| US-6 | chatQueue + AsyncStorage offline queue + flush on reconnect |
| US-9 | useChatInbox + ChannelListItem unread badge (chatListChannels) |
| US-7/US-8 | TypingIndicator / read receipts in useChatRoom |
| US-10 | CHAT_MESSAGE deep-link → ChatRoom |
| US-13/US-14 | "Chat" buttons on activity cards |
| US-3 (UI) | LockedBanner + disabled composer |

## Extension Compliance Targets
- **PBT**: PBT-04 (queue dedup/exactly-once), PBT-03 (message ordering, unread≥0), PBT-10 (example + property).
- **Security**: SECURITY-05 (composer cap), -08 (token on connect), -03/-01 (no token logs, WSS).

## Scope
- Backend: 1 handler + 2 OpenAPI + 1 test. Mobile: ~6 pure-logic + 2 hooks + 9 UI + ~6 integration
  edits + 4 tests + 1 doc. Route/integration Terraform → U6.
