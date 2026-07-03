# U5 Mobile Client — Infrastructure Design

The mobile app is a client (no server infra of its own; built/distributed via **EAS/Expo**). U5's only
cloud infra is the backend addition it depends on.

## Backend addition — `chat-list-channels` Lambda + `GET /chat/channels`
- Lambda `chatListChannels.default` (read-only), env `DYNAMODB_TABLE_NAME`, retention ≥ 90d.
- OpenAPI-driven `GET /chat/channels` (query: `cursor?`, `limit?`), `CognitoAuthorizer`, request
  validator, AWS_PROXY integration injecting `requesterId = $context.authorizer.claims.sub`.
- **IAM (SECURITY-06)**: DynamoDB `Query` on `GSI1` (membership inbox) + `GetItem` — read-only.
- Integration VTL + route registration + Terraform: wired in **U6** (same as `chat-get-history`).

## Mobile app configuration
- Add **`WEBSOCKET_URL`** (WSS endpoint) to the mobile env/config (`setup/config`), supplied per
  environment at build time (EAS env / `.env`), alongside the existing API base URL + Cognito config.
- No secrets embedded; the Cognito token is obtained at runtime from the existing auth/session.

## Transport / security
- WSS + HTTPS only (SECURITY-01). Token passed on WS connect (`?token=`), never logged (SECURITY-03).

## Distribution
- App built and released via **EAS** (existing mobile pipeline) — no new infra.

## Security mapping
- SECURITY-06 (read-only IAM for `chat-list-channels`) ✅; -08 (Cognito) ✅; -01/-03 (WSS/HTTPS, no
  token logs) ✅; -02/-14 (REST logging/retention, inherited/≥90d) ✅.
