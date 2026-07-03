# U4 History + Push — NFR Design Patterns

| Pattern | Applied To | Realizes |
|---|---|---|
| **Opaque Cursor (encapsulation)** | base64(JSON) of `LastEvaluatedKey` | BR-U4-3 (clients never see raw keys) |
| **Clamp / Guard Input** | `clampLimit` → `[1,20]` | NFR-U4-P2, BR-U4-1 |
| **Thin Adapter over Domain** | `chatGetHistory` delegates to U1 `getHistory` | NFR-U4-M1 |
| **Selective Side-Effect (publish-only)** | `CHAT_MESSAGE` branch skips persistence | BR-U4-5 (no notification-table bloat) |
| **Server-Derived Identity** | `requesterId` from Cognito `sub` | BR-U4-4, SECURITY-08 |
| **Fail-Closed + Error Taxonomy** | REST error mapping via `ChatOperationError` | SECURITY-15 |
| **Log Redaction** | no message bodies in logs | SECURITY-03 |

## Cursor robustness
- `decodeCursor` wraps `JSON.parse(base64decode(...))` in try/catch → `ChatValidationError` (400) on
  any malformed input; never throws an unhandled error.

## Push isolation
- The publish-only branch is additive and ordered before the generic `else`; existing
  BLOOD_REQ_POST / REQ_ACCEPTED / REQ_IGNORED / COMMON behavior is unchanged (regression-guarded by
  existing notification tests + a new CHAT_MESSAGE test).

## Security mapping
- SECURITY-05 (cursor/limit/channelId), -08 (cognito identity + participant), -15/-03 (fail-closed,
  redaction). IAM (-06) → U6.
