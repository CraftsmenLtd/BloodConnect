# U4 History + Push — NFR Requirements

## Performance
- **NFR-U4-P1**: History query is a single bounded DynamoDB query (PK = `CHAT_MSG#<channelId>`,
  `Limit ≤ 20`, reverse scan); p99 well within REST latency budget.
- **NFR-U4-P2**: Cursor pagination avoids large scans; no client-driven unbounded limits (clamped).

## Scalability
- **NFR-U4-S1**: Reads scale with DynamoDB; per-channel message partition.
- **NFR-U4-S2**: Push reuses the existing SQS→SNS pipeline (no new throughput surface).

## Reliability / Availability
- **NFR-U4-R1**: Stateless REST Lambda; fail-closed; typed error mapping.
- **NFR-U4-R2**: `CHAT_MESSAGE` publish-only — a push failure does not corrupt chat state (messages
  already persisted by U1/U3).

## Security (extension)
- **NFR-U4-SEC1 (SECURITY-08)**: Cognito-authenticated; `requesterId` from `sub`; participant check.
- **NFR-U4-SEC2 (SECURITY-05)**: Validate `channelId`, decode `cursor` safely, clamp `limit`.
- **NFR-U4-SEC3 (SECURITY-06)**: REST Lambda IAM scoped to DynamoDB read on table + `CHAT_MSG`/channel
  items (authored in U6).
- **NFR-U4-SEC4 (SECURITY-15/03)**: Fail-closed; no message bodies in logs.

## Maintainability / Testability
- **NFR-U4-M1**: Thin REST handler over U1 `getHistory`; pure cursor/clamp helpers.
- **NFR-U4-M2 (PBT)**: cursor round-trip + limit-clamp invariant; example tests for 403 / malformed
  cursor / CHAT_MESSAGE publish-only. ≥ 60% function coverage.

## Out of scope for U4 (elsewhere)
- Mobile history UI + deep-link consumption (U5); REST route/integration Terraform + IAM (U4 Infra
  Design declares; U6 consolidates).
