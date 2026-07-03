# U4 History + Push — Business Rules

| ID | Rule | Trace |
|---|---|---|
| **BR-U4-1** | History is returned newest-first, page size clamped to ≤ 20, cursor-based. | FR-4, US-5 |
| **BR-U4-2** | Only a participant of the channel may read history (`403` otherwise). | SECURITY-08, US-11 |
| **BR-U4-3** | The cursor is an opaque base64(JSON) encoding of the DynamoDB `LastEvaluatedKey`; a malformed cursor is rejected (`400`). | SECURITY-05 |
| **BR-U4-4** | `requesterId` is the Cognito `sub` from the authenticated REST request — never taken from a client-supplied body field. | SECURITY-08 |
| **BR-U4-5** | `CHAT_MESSAGE` notifications are **publish-only** — pushed via SNS but **not** persisted as generic notification records (chat messages already live in the chat tables). | FR-8 (design) |
| **BR-U4-6** | The `CHAT_MESSAGE` push payload carries `{ channelId, requestPostId, seekerId, donorId, senderId, messageId }` so the mobile app can deep-link to the correct room. | FR-8, US-10 |
| **BR-U4-7** | All handlers fail-closed; errors mapped via `ChatOperationError.errorCode`; no message bodies/tokens in logs. | SECURITY-15/03 |

## Testable Properties (PBT-01)
- **Round-trip (PBT-02)**: `decodeCursor(encodeCursor(key)) == key` for arbitrary key maps.
- **Invariant (PBT-03)**: `limit` is always clamped into `[1, 20]`.
- Example tests: participant 403; malformed cursor 400; CHAT_MESSAGE → publish-only (no
  `createNotification`).

## Security mapping
- SECURITY-05 (cursor/channelId/limit validation), -08 (participant + cognito identity), -15/-03
  (fail-closed, redaction). IAM (-06) for the new REST Lambda → U6.
