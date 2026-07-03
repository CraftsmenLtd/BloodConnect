# Security Test Instructions — In-app Chat (Security extension = ON, blocking)

## Authentication / Authorization (SECURITY-08/12)
- WS `$connect` without/with an invalid `?token=` → **403** (no connection stored). Valid Cognito token → Allow.
- Message routes resolve `senderId` from the stored connection (`getConnectionUser`) — a forged
  `senderId` in the body has no effect. Verify a non-participant cannot read history/channels or post (**403**).
- REST `requesterId` comes from `$context.authorizer.claims.sub` — never a client body field.

## Input validation (SECURITY-05)
- Message body: reject empty / > 2000 chars / disallowed control chars; emoji allowed.
- `channelId` must be composite `<id>#<id>`; ids allowlisted/bounded; malformed `cursor` → 400.

## Least-privilege IAM (SECURITY-06)
- Review `iac/terraform/aws/chat/policies.tf`: read-only Lambdas (`chat-get-history`/`chat-list-channels`)
  have no write/manage/sqs; only `chat-send-message` has `sqs:SendMessage`; `@connections/*` is scoped.
- `checkov`/`tfsec` scan of the chat module (no wildcard actions/resources beyond `@connections/*`).

## Logging / data protection (SECURITY-03/14, -01)
- Confirm no message bodies/tokens in CloudWatch (`data_trace_enabled=false`); WS log group retention ≥ 90d.
- Transport TLS only (WSS/HTTPS); DynamoDB encrypted at rest (default); chat items TTL at 90 days.

## Abuse / rate limiting (SECURITY-11)
- Verify 60 msg/min/channel throttle (see performance-test-instructions.md).

## Supply chain (SECURITY-10)
- `npm audit` (note: repo has pre-existing advisories unrelated to chat); new deps pinned + lockfiled:
  `fast-check`, `aws-jwt-verify`, `@aws-sdk/client-apigatewaymanagementapi`, `@aws-sdk/util-dynamodb`.

## Fail-closed (SECURITY-15)
- Handlers map errors via `ChatOperationError.errorCode`; unexpected errors → deny/generic message;
  stream consumer reports `batchItemFailures` (retry) rather than silently dropping.

## OpenAPI lint (contract)
```bash
make bundle-openapi && make lint-api   # spectral; chat paths must pass
```
