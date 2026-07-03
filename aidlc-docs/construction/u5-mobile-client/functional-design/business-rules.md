# U5 Mobile Client — Business Rules

| ID | Rule | Trace |
|---|---|---|
| **BR-U5-1** | The inbox lists the user's channels (recency-sorted) with latest-message preview + unread badge. | US-9 |
| **BR-U5-2** | `ChatRoom` distinguishes sent vs received bubbles and shows the request context in the header. | US-4 |
| **BR-U5-3** | Messages composed offline are queued (with `clientMessageId`) and delivered in order on reconnect; UI shows optimistic status. | US-6 |
| **BR-U5-4** | The WebSocket connects with the Cognito token (`?token=`); on drop, reconnect with backoff and flush the queue. | FR-3, US-6 |
| **BR-U5-5** | Typing indicator is shown transiently from `TYPING` events; read receipts update from `READ_RECEIPT`. | US-7, US-8 |
| **BR-U5-6** | A `LOCKED` channel renders read-only with the banner _"This chat is closed as the donation request is complete."_ and disables the composer. | US-3 |
| **BR-U5-7** | A `CHAT_MESSAGE` push tap deep-links to the correct `ChatRoom` (by `channelId`). | US-10 |
| **BR-U5-8** | "Chat" buttons appear on the seeker's accepted-donor card and the donor's active-donation card. | US-13, US-14 |
| **BR-U5-9** | History loads newest-first, paginated via the opaque cursor; older pages prepend. | US-5 |
| **BR-U5-10** | Message composer enforces the 2000-char limit client-side (server re-validates). | US-4 |

## Testable Properties (PBT-01)
- **Idempotence (PBT-04)**: the offline queue never sends duplicate `clientMessageId`s after repeated
  flushes (model: flush(flush(queue)) delivers each id once).
- **Invariant (PBT-03)**: message-list ordering stays chronological after interleaved
  append/prepend/receipt updates; unread badge ≥ 0.
- Example tests: `useChatRoom` send (online → ws.send; offline → enqueue), receive append, locked →
  composer disabled; `useChatInbox` load/refresh.

## Security mapping
- SECURITY-05 (client-side length cap; server authoritative), SECURITY-08 (token on connect; no
  client-trusted identity), SECURITY-03 (no tokens in logs). Transport WSS/HTTPS (SECURITY-01).
