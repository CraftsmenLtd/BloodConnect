# End-to-End Test Instructions — In-app Chat

## Purpose
Walk the full user journey (US-1..US-14) across mobile + backend.

## Prerequisites
- Backend deployed (LocalStack `make start-dev` or a dev AWS stage).
- Mobile: set `WEBSOCKET_URL` (= `module.chat.websocket_api_endpoint`) + REST base URL + Cognito in
  EAS env / `.env`; run the app (`expo start`). *(Note: the nav/notification/entry-button wiring is the
  documented U5 remaining task — complete it first to exercise the full mobile flow end-to-end.)*

## Journey
1. **Seeker** creates a blood request; **Donor** accepts → both see a chat (US-1/US-2). Confirm the
   channel auto-created.
2. **Open ChatRoom** → header shows blood-group/urgency/date/location (US-4 header); history loads
   newest-first (US-5).
3. **Send a message** online → appears instantly (optimistic), other party receives in real time (US-4);
   **typing** indicator (US-7) and **read receipt** (US-8) update.
4. **Go offline**, send → message queued; **reconnect** → delivered exactly once (US-6).
5. **Recipient backgrounded** → `CHAT_MESSAGE` push; tap → deep-links to the correct `ChatRoom` (US-10).
6. **Inbox** lists channels with preview + unread badge (US-9).
7. **Complete** the donation → ChatRoom becomes read-only with the locked banner; composer disabled (US-3).
8. **"Chat" buttons** present on the seeker's accepted-donor card + donor's active-donation card (US-13/US-14).

## Pass criteria
- All steps behave as above; no message loss; locked channel rejects sends; push deep-link opens the
  right room; only the two participants can access the channel (others → 403).

## Automation-friendly hooks
- `testID`s present: `chat-inbox-list`, `chat-inbox-item-<id>`, `chat-room-message-list`,
  `chat-room-message-<id>`, `chat-room-composer-input`, `chat-room-send-button`,
  `chat-room-locked-banner`.
