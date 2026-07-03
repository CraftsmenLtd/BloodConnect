# Integration Test Instructions — In-app Chat

## Purpose
Validate interactions across units on LocalStack (Q10=C): stream → channel, WebSocket → message,
push fallback, REST history/channels, lock-on-complete.

## Setup
```bash
make prep-dev          # install + build + package lambdas
make localstack-start  # LocalStack container
make start-dev         # LocalStack + Terraform apply (incl. the new chat module)
# capture: terraform output module.chat.websocket_api_endpoint  -> use as WEBSOCKET_URL
```
> LocalStack caveat: API GW v2 **WebSocket + Lambda authorizer** support varies by edition. If the WS
> path is unsupported locally, validate stream + REST locally and the WS path on a dev AWS stage.

## Scenarios
### S1 — Acceptance → channel creation (U2→U1)
- **Steps**: create a blood request; a donor accepts (`AcceptDonationStatus=ACCEPTED`).
- **Expect**: a `CHAT_CHANNEL#<requestPostId>#<donorId>` META item + 2 `CHAT_USER#` membership items.

### S2 — WebSocket connect + send (U3→U1, realtime)
- **Steps**: connect `wss://.../<stage>?token=<cognito>`; send `{action:"sendMessage",channelId,body,clientMessageId}`.
- **Expect**: a `CHAT_MSG#` item + dedup guard; the other connected participant's socket receives a `MESSAGE` event.

### S3 — Offline push fallback (U3→U4 push)
- **Steps**: recipient not connected; sender sends a message.
- **Expect**: a `CHAT_MESSAGE` item lands on the push SQS queue → `send-push-notification` → SNS; **no** generic notification record persisted (publish-only).

### S4 — REST history + channels (U4 / U5 backend)
- **Steps**: `GET /chat/history?channelId=...`; `GET /chat/channels` (Cognito).
- **Expect**: newest-first messages with `nextCursor`; the channel listed; non-participant → 403; malformed cursor → 400.

### S5 — Lock on completion (U2 fan-out)
- **Steps**: complete the donation request (`DonationStatus=COMPLETED`).
- **Expect**: all that request's channels flip to `LOCKED`; subsequent `sendMessage` rejected (409).

## Run / verify / cleanup
```bash
# inspect items
awslocal dynamodb scan --table-name <env>-bloodConnect-table --filter-expression 'begins_with(PK,:p)' \
  --expression-attribute-values '{":p":{"S":"CHAT_"}}'
# logs
awslocal logs tail /aws/apigateway/<env>-bloodConnect-chat-ws
make stop-dev   # or localstack stop
```
