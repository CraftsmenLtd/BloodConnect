# U5 Mobile Client — Deployment Architecture

## Mobile app
- Built/distributed via **EAS/Expo** (existing pipeline). New `WEBSOCKET_URL` provided via EAS env /
  `.env` per environment. No new infra.

## Backend addition (`chat-list-channels`)
- Bundled by esbuild like the other chat handlers; Lambda + read-only IAM + `GET /chat/channels` route
  consolidated in **U6** (with `chat-get-history` and the WebSocket API).

## Environments
- **AWS** (ap-south-1) + **LocalStack** for the backend endpoint; mobile points `WEBSOCKET_URL` at the
  stage's WSS URL and the REST base URL.

## Rollout / Rollback
- **Rollout**: ship backend endpoints (U6) first, then release the mobile build pointing at them.
- **Rollback**: a mobile release can be rolled back independently (EAS); backend endpoints are additive.

## Validation
- Inbox lists channels; opening a room loads history + connects WS; offline send then reconnect
  delivers; `CHAT_MESSAGE` push deep-links to the room; locked channel is read-only.
