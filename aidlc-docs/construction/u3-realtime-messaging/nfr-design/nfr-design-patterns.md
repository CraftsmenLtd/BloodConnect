# U3 Real-time Messaging — NFR Design Patterns

| Pattern | Applied To | Realizes |
|---|---|---|
| **Token Verifier with JWKS Cache** | `chatAuthorizer` (`aws-jwt-verify` verifier created at module scope) | NFR-U3-P3, SECURITY-12 |
| **Gateway Authorizer (deny-by-default)** | `$connect` | BR-U3-1, SECURITY-08 |
| **Stateless Connection Registry** | DynamoDB connection items (per-user GSI1) | NFR-U3-S2 |
| **Ports & Adapters** | `RealtimeNotifier` / `OfflineNotifier` impls behind U1 ports | NFR-U3-M1 |
| **Scatter Delivery + Self-Healing** | `postToConnections` fan-out; `GoneException` → remove | BR-U3-6/7, NFR-U3-R1 |
| **Fallback (graceful degradation)** | offline recipient → SQS `CHAT_MESSAGE` push | BR-U3-9, NFR-U3-R2 |
| **Input Validation Gate** | inbound WS frame parse/validate before processing | BR-U3-4, SECURITY-05 |
| **Fail-Closed + Error Taxonomy** | every handler; reuse U1 `ChatOperationError` mapping | SECURITY-15 |
| **Log Redaction** | structured logs without token/body | SECURITY-03 |

## WebSocket endpoint resolution
- Build the management-API endpoint from `requestContext.domainName` + `requestContext.stage`
  per-request (works across stages/regions) with a `WEBSOCKET_ENDPOINT` env override for LocalStack.

## Connection→user resolution
- `getConnectionUser(connectionId)` (DynamoDB `getItem`) — O(1); `403` if absent. Avoids trusting any
  client-supplied identity on message frames (only `$connect` is authenticated; identity is bound to
  the connection server-side).

## Failure semantics
- Authorizer throw / deny → `$connect` `403`.
- Per-frame error → handler returns a non-2xx (or posts an error event) without crashing the socket;
  fail-closed.
- `PostToConnection` `GoneException` → prune; other errors → logged, delivery continues.

## Security mapping
- SECURITY-08/12 (authorizer + JWT), -05 (frame validation), -06 (IAM → Infra/U6), -03/-15 (logs +
  fail-closed), -02 (WS access logging → Infra/U6).
