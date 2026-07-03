# U5 Mobile Client — NFR Requirements

## Performance
- **NFR-U5-P1**: Message list virtualized (`FlatList`) for smooth scroll; history paged (≤20).
- **NFR-U5-P2**: WebSocket reconnect with capped exponential backoff; typing events throttled.
- **NFR-U5-P3**: Optimistic send (render immediately) — perceived latency ~0.

## Reliability / Availability
- **NFR-U5-R1**: Offline queue (AsyncStorage) survives app restarts; flush on reconnect; server dedup
  guarantees exactly-once.
- **NFR-U5-R2**: Graceful degradation — if WS is down, history (REST) still loads; sends queue.
- **NFR-U5-R3**: Reconnect on foreground/online transitions; stale socket cleanup.

## Security (extension)
- **NFR-U5-SEC1 (SECURITY-08)**: Cognito token supplied on WS connect; never logged.
- **NFR-U5-SEC2 (SECURITY-05)**: Client-side length cap (2000) on the composer; server authoritative.
- **NFR-U5-SEC3 (SECURITY-01)**: WSS/HTTPS only.
- **NFR-U5-SEC4 (SECURITY-03)**: No tokens/message bodies in client logs.

## Usability / Accessibility
- **NFR-U5-U1**: Clear sent/received distinction, status (queued/sent/read), typing indicator, locked
  banner.
- **NFR-U5-U2**: `testID`/accessibility labels on interactive elements (automation-friendly).

## Maintainability / Testability
- **NFR-U5-M1**: Logic in hooks (`useChatInbox`/`useChatRoom`); components are presentational.
- **NFR-U5-M2 (PBT)**: fast-check for the offline-queue dedup + ordering invariants (pure reducers);
  example tests for hooks/components via `@testing-library/react-native`. (Mobile coverage per repo.)

## Out of scope for U5 (elsewhere)
- WebSocket API + REST routes + IAM Terraform (U6); the `chatListChannels` Lambda is a U5 backend
  addition but its route/integration Terraform is wired in U6.
