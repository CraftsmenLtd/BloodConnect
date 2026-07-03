# U6 Infrastructure & Integration — Deployment Runbook

## Build
- `make build-node-all` (esbuild bundles the 9 chat handlers).
- `make bundle-openapi` (Redocly bundles `openapi/versions/v1.json` incl. the new chat paths).

## Apply (AWS — ap-south-1)
1. `terraform fmt -check` + `terraform validate` (chat module + root).
2. `terraform plan` / `apply` — creates the chat module (Lambdas, WebSocket API, authorizer, stream
   mapping, IAM) and registers the REST routes.
3. Capture `module.chat.websocket_api_endpoint` → set mobile `WEBSOCKET_URL` (EAS env per environment).

## Apply (LocalStack)
- `make start-dev` (LocalStack + Terraform). Caveat: some LocalStack editions have limited API GW v2
  WebSocket / Lambda-authorizer support — if so, validate the stream + REST paths locally and the
  WebSocket path on a dev AWS stage.

## Rollout / Rollback
- **Rollout**: additive; deploy backend (this module) before releasing the mobile build that points at
  `WEBSOCKET_URL`.
- **Rollback**: `terraform destroy -target module.chat` (or remove the module block) disables chat;
  chat data is TTL'd; no migration; existing donation/notification flows untouched.

## End-to-end validation (LocalStack or dev AWS)
1. Seeker creates a request; a donor accepts → confirm `CHAT_CHANNEL#<id>` META + 2 membership items.
2. Connect WS with a Cognito token → `CHAT_CONN#` item; send a message → recipient socket receives
   `MESSAGE`; recipient offline → a `CHAT_MESSAGE` SQS item is enqueued (and pushed via SNS).
3. `GET /chat/channels` lists the channel; `GET /chat/history?channelId=...` returns the message.
4. Complete the donation → channel flips to `LOCKED`; sends are rejected; locked banner shows on mobile.

## Operational notes
- Alarms (optional, follow-up): authorizer failures, 5xx on chat Lambdas, stream iterator age.
- Cost: on-demand; chat items TTL at 90 days.
