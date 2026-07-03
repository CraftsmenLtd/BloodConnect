# U5 Mobile Client — NFR Design Patterns

| Pattern | Applied To | Realizes |
|---|---|---|
| **Optimistic UI** | send → render `queued/sending` immediately | NFR-U5-P3 |
| **Pure Reducer (testable core)** | `chatQueue` reducer (enqueue/ack/dedup) + message-list reducer | NFR-U5-M2, PBT-04/03 |
| **Persistent Outbox** | AsyncStorage-backed offline queue | NFR-U5-R1 |
| **Reconnect with Backoff** | WS client wrapper (capped exponential) | NFR-U5-P2/R3 |
| **Container / Presentational** | hooks own logic; components render | NFR-U5-M1 |
| **Adapter (WS client wrapper)** | `ChatSocket` over native `WebSocket` (testable, mockable) | NFR-U5-M2 |
| **Graceful Degradation** | REST history works without WS; sends queue | NFR-U5-R2 |
| **Deep-Link Router** | `CHAT_MESSAGE` payload → `ChatRoom` | US-10 |
| **Idempotent Delivery** | `clientMessageId` + server dedup | PBT-04 |

## Pure cores (unit/PBT-testable outside React)
- **`chatQueue` reducer**: `{ enqueue(msg), ack(clientMessageId), pending() }` — dedups by
  `clientMessageId`; `flush(flush(q))` delivers each id once (PBT-04).
- **`mergeMessages` reducer**: insert/append/prepend keeping chronological order, no duplicates
  (by `messageId`/`clientMessageId`); unread count ≥ 0 (PBT-03).

## WS client wrapper (`ChatSocket`)
- `connect(url, token)`, `onEvent(cb)`, `send(frame)`, `close()`, reconnect with backoff. Wraps the
  global `WebSocket` so hooks depend on an interface (injectable mock in tests).

## Security mapping
- SECURITY-08 (token on connect, not logged), -05 (composer cap), -01 (WSS), -03 (no sensitive logs).
