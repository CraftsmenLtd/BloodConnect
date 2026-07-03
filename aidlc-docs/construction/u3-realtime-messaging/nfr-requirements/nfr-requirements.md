# U3 Real-time Messaging — NFR Requirements

## Performance
- **NFR-U3-P1**: Real-time delivery to connected participants target **< 1 s** end-to-end.
- **NFR-U3-P2**: Per-message work bounded — 1 connection lookup + U1 send (Transact + membership
  updates) + fan-out post to a small set of connections.
- **NFR-U3-P3**: JWT verification uses `aws-jwt-verify` with **JWKS caching** (verifier created once,
  reused across invocations) to avoid per-connect network round-trips.

## Scalability
- **NFR-U3-S1**: API Gateway WebSocket scales connections; connection state in DynamoDB (per-user
  GSI1 fan-out).
- **NFR-U3-S2**: No in-memory connection registry — horizontally scalable across Lambda instances.

## Availability / Reliability
- **NFR-U3-R1**: `GoneException` → connection removed (self-healing); delivery to remaining
  connections proceeds.
- **NFR-U3-R2**: Offline recipient → `CHAT_MESSAGE` push fallback (no lost coordination).
- **NFR-U3-R3**: Fail-closed handlers; malformed frames rejected; one bad post does not abort the
  others.

## Security (extension)
- **NFR-U3-SEC1 (SECURITY-08/12)**: Cognito JWT verified server-side on `$connect`; non-participant /
  unauthenticated rejected (`403`).
- **NFR-U3-SEC2 (SECURITY-05)**: Validate every inbound frame (action allowlist, channelId, body
  length, ids).
- **NFR-U3-SEC3 (SECURITY-06)**: Least-privilege IAM — `execute-api:ManageConnections` on the
  WebSocket API ARN, `sqs:SendMessage` on the push queue, scoped DynamoDB actions.
- **NFR-U3-SEC4 (SECURITY-03/15)**: No token/body in logs; fail-closed.
- **NFR-U3-SEC5 (SECURITY-02)**: WebSocket API access/execution logging enabled (U3 Infra / U6).

## Maintainability / Testability
- **NFR-U3-M1**: Handlers are thin adapters over U1 services; the two new adapters (`RealtimeNotifier`,
  `OfflineNotifier`) are unit-testable with aws-sdk-client-mock.
- **NFR-U3-M2 (PBT)**: fast-check for WS-envelope round-trip + stale-connection invariant; example
  tests for each handler. ≥ 60% function coverage.

## Out of scope for U3 (elsewhere)
- REST history + OpenAPI + mobile deep-link/consumption (U4); WebSocket API + authorizer + IAM
  Terraform + Cognito/endpoint env wiring (U3 Infra Design declares; U6 consolidates).
