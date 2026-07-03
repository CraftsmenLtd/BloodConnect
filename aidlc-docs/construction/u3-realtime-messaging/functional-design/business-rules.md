# U3 Real-time Messaging — Business Rules

| ID | Rule | Trace |
|---|---|---|
| **BR-U3-1** | `$connect` is rejected (`403`, no connection stored) unless a valid, unexpired Cognito JWT is supplied via `?token=`. | FR-2, US-11, SECURITY-08/12 |
| **BR-U3-2** | `userId` is taken from the verified token on connect and **persisted with the connection**; message routes resolve `senderId` from `connectionId` (authorizer context is not propagated). | FR-2 |
| **BR-U3-3** | A message route from a `connectionId` with no stored connection is rejected (`403`). | SECURITY-08 |
| **BR-U3-4** | Inbound WS frames are validated (allowed `action`; `channelId` composite; `body` ≤ 2000; `clientMessageId` present for sends) before processing. | SECURITY-05 |
| **BR-U3-5** | Participant, channel-OPEN, and rate-limit rules are enforced by `ChatMessageService` (U1); U3 must not bypass them. | US-4/US-11/US-12 |
| **BR-U3-6** | Real-time delivery targets the recipient's **and the sender's other** connections (multi-device); the sender's originating connection is not required to echo. | FR-3 |
| **BR-U3-7** | `GoneException` on post-to-connection ⇒ that connection is removed (self-healing). | NFR-4, BR-13 (U1) |
| **BR-U3-8** | Typing events are ephemeral (never persisted); read receipts persist `lastReadAt` (via U1). | FR-9 |
| **BR-U3-9** | When the recipient has no active connection, a `CHAT_MESSAGE` push is enqueued (offline fallback). | FR-8, US-10 |
| **BR-U3-10** | All handlers are fail-closed; no token/message body in logs. | SECURITY-15/03 |

## Testable Properties (PBT-01)
- **Round-trip (PBT-02)**: WS frame parse↔build for the client envelope; `ChatRealtimeEvent`
  serialize↔deserialize.
- **Invariant (PBT-03)**: `postToConnections` returns only connectionIds that produced `GoneException`
  as stale; never marks a successful one stale.
- Most business invariants (idempotence, unread, rate-limit, authz) are already proven in U1; U3 adds
  example tests for the handler wiring + the two adapters.

## Security mapping
- SECURITY-08/12 (auth on connect, server-side JWT verify), -05 (frame validation), -15 (fail-closed),
  -03 (no sensitive logs). -06 (IAM: manage-connections, SQS send) → U3 Infra / U6.
