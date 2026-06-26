# I-571 — In-App Chat Among Donor and Seeker — Implementation Plan

**Issue:** [#571](https://github.com/CraftsmenLtd/BloodConnect/issues/571) — FEAT: In app chat among donor and seeker
**Branch:** `I-571-chat-feature`
**Status:** Planning

---

## 1. Summary

Auto-create a private chat channel when a donor's acceptance status transitions to `ACCEPTED`,
scoped to the triplet **(seekerId, requestPostId, donorId)**. Removes phone-number exposure;
keeps coordination in-app, persistent, and trackable. Delivery via WebSocket when the peer is
connected, push notification otherwise. Channels lock when the donation completes/expires/is
ignored. Messages retained 90 days via DynamoDB TTL.

---

## 2. Decisions (confirmed)

| # | Decision | Choice |
|---|----------|--------|
| 1 | Delivery | **Phased: PR1 backend → PR2 mobile** |
| 2 | WebSocket `$connect` auth | **Lambda authorizer validating Cognito access token (query param)** |
| 3 | Storage | **Dedicated chat table(s)** (messages + connection registry), separate from main single-table |

---

## 3. Grounding — what already exists (verified)

- **DynamoDB stream is on:** `iac/terraform/aws/dynamodb/dynamodb.tf:8-9` (`stream_enabled = true`, `NEW_AND_OLD_IMAGES`). Reuse for channel auto-creation.
- **EventBridge Pipe pattern exists:** `iac/terraform/aws/eventbridge/eventbridge.tf` already has `donation_request_pipe`, `donation_accept_pipe` (filters stream on ACCEPT → `donation_status_manager`), `donation_ignore_pipe`. We add a **chat channel pipe** the same way.
- **ACCEPTED transition point:** `core/application/bloodDonationWorkflow/AcceptDonationRequestService.ts:62` (`status === AcceptDonationStatus.ACCEPTED`), already pushes to seeker via `sendNotificationToSeeker`.
- **Status enums:** `commons/dto/DonationDTO.ts` — `AcceptDonationStatus { PENDING, ACCEPTED, COMPLETED, IGNORED }`, `DonationStatus { PENDING, COMPLETED, CANCELLED, MANAGED, EXPIRED }`. Locking conditions derive from these.
- **Push handlers exist:** `core/services/aws/notification/{registerUserDevice,sendPushNotification}.ts` (SNS). Reuse for offline delivery + deep-link payloads.
- **No WebSocket infra anywhere** → greenfield WS API Gateway.
- **Lambda registration convention:** `iac/terraform/aws/<domain>/lambdas.tf` `lambda_options` map (name/handler/js_file_name/statement/invocation_arn_placeholder/env_variables) → `modules.tf` `for_each` over shared `iac/terraform/aws/lambda` module. New `chat` domain follows this.
- **Mobile anchors:** `clients/mobile/src/myActivity/{donorTracking,myPosts}` (Chat buttons), `setup/notification` (deep-link), `setup/navigation` (new screens), `setup/clients/useFetchClient.ts` (REST history), `setup/language/locales/{en,bn}` (i18n).

Relevant project skills to follow: **add-backend-endpoint**, **add-dynamodb-model**, **terraform-domain-infra**, **donor-search-notification-flow**, **write-backend-tests**, **mobile-feature**, **openapi-spec-change**.

---

## 4. Architecture

```
Donor taps Accept
   │
   ▼
AcceptDonationService  →  AcceptDonation record status=ACCEPTED  (main table)
   │                                   │ (DynamoDB stream)
   │                                   ▼
   │                        EventBridge Pipe (chat_channel_pipe)
   │                        filter: AcceptDonation, status==ACCEPTED, INSERT/MODIFY
   │                                   ▼
   │                        createChatChannel Lambda
   │                                   ▼
   │                        ChatChannel item  (chat table)  PK=CHANNEL#<channelId>
   │
Mobile  ──$connect (Cognito JWT qs)──►  WS API GW ──authorizer──►  connect Lambda
   │                                                                 └─ ConnectionRegistry item
   ├──sendMessage──►  WS API GW  ──►  sendMessage Lambda
   │                                    ├─ persist Message (TTL 90d)
   │                                    ├─ peer connected?  → postToConnection (WS)
   │                                    └─ peer offline?    → sendPushNotification (deep-link)
   ├──getHistory──►  REST API GW  ──►  getChatHistory Lambda  (paginated)
   └──$disconnect──►  disconnect Lambda  → remove ConnectionRegistry item
```

**Channel lock:** when `DonationStatus` → COMPLETED/EXPIRED/CANCELLED or `AcceptDonationStatus` → COMPLETED/IGNORED, a stream-driven lock Lambda sets `channel.locked = true`. `sendMessage` rejects writes to locked channels.

---

## 5. Data model — dedicated chat table(s)

**Table `chat`** (single-table for chat domain), `stream_enabled` for future fan-out, TTL attr `expiresAt`.

| Entity | PK | SK | Key attrs | TTL |
|--------|----|----|-----------|-----|
| Channel | `CHANNEL#<channelId>` | `META` | seekerId, requestPostId, donorId, locked, lastMessagePreview, createdAt | — |
| Message | `CHANNEL#<channelId>` | `MSG#<ISO-ts>#<msgId>` | senderId, content, deliveredVia, readAt | `expiresAt` (createdAt + 90d) |
| Connection | `CONN#<connectionId>` | `META` | userId, connectedAt | `expiresAt` (idle GC) |
| UserChannel (inbox) | `USER#<userId>` | `CHANNEL#<channelId>` | unreadCount, lastMessagePreview, updatedAt | — |

- `channelId` = deterministic hash of `(seekerId, requestPostId, donorId)` → idempotent creation (stream may redeliver).
- GSI `byUser` not needed — UserChannel rows under `USER#` serve the inbox query directly.
- Reuse `commons/ddbModels` + `DynamoDbTableOperations` base per **add-dynamodb-model** skill.

DTOs added to `commons/dto/ChatDTO.ts`. Constants/limits in `commons/libs/constants/` (retention days, rate limit) — no magic numbers.

---

## 6. PR1 — Backend (this ticket's primary deliverable)

### 6.1 Infrastructure — `iac/terraform/aws/chat/`
- New domain module: `data.tf`, `lambdas.tf`, `modules.tf`, `policies.tf`, `outputs.tf`, `variables.tf` (per **terraform-domain-infra** skill).
- **WebSocket API Gateway** (`aws_apigatewayv2_api` protocol `WEBSOCKET`, route selection `$request.body.action`): routes `$connect`, `$disconnect`, `sendMessage` (+ `$default`).
- **Lambda authorizer** (`aws_apigatewayv2_authorizer`, REQUEST) validating Cognito access token from `$connect` query string against existing user pool.
- **REST route** for history on the existing HTTP API (OpenAPI path) — see 6.3.
- **Chat DynamoDB table** + TTL + stream → extend `iac/terraform/aws/dynamodb` or new `iac/terraform/aws/chat` table resource.
- **EventBridge Pipe `chat_channel_pipe`** (mirror `donation_accept_pipe`): source = main table stream, filter AcceptDonation+ACCEPTED, target = `createChatChannel`.
- **EventBridge Pipe `chat_lock_pipe`**: filter donation/acceptance terminal states → `lockChatChannel`.
- IAM via `concat(local.policies...)`; new policy bundles for WS `postToConnection`, chat-table CRUD.
- Wire module in root `iac/terraform/aws/modules.tf`. Checkov-clean (documented skips only).

### 6.2 Lambda handlers — `core/services/aws/chat/`
One file per handler, `export default`, follow **add-backend-endpoint** handler skeleton (`Config`, `createHTTPLogger`, `generateApiGatewayResponse`, typed `ChatOperationError`):

| Handler | Route/trigger | Responsibility |
|---------|---------------|----------------|
| `chatAuthorizer.ts` | WS authorizer | Validate Cognito JWT, return IAM allow + userId context |
| `connect.ts` | `$connect` | Write ConnectionRegistry, map userId↔connectionId |
| `disconnect.ts` | `$disconnect` | Remove ConnectionRegistry item |
| `sendMessage.ts` | `sendMessage` | Rate-limit (60/min), reject if channel locked, persist message, deliver WS-or-push, bump unread |
| `getChatHistory.ts` | REST GET | Paginated message history for a channel (auth: caller ∈ channel) |
| `getChatInbox.ts` | REST GET | List UserChannel rows w/ preview + unread |
| `createChatChannel.ts` | Pipe (stream) | Idempotent channel + UserChannel(seeker,donor) creation |
| `lockChatChannel.ts` | Pipe (stream) | Set `locked=true` on terminal donation/acceptance state |

### 6.3 Domain layer — `core/application/chatWorkflow/`
- `ChatService.ts` — channel creation, message send/persist, lock, unread bookkeeping. Constructor-injected `ChatRepository` + `Logger` (no AWS SDK imports — **add-domain-service** rule).
- `ChatConnectionService.ts` — connection registry + delivery decision (WS vs push).
- `Types.ts` + `validationRules` (content length, non-empty), `validateInputWithRules` from `core/application/utils/validator.ts`.
- Repository ports in `core/application/models/policies/repositories/`.
- Typed `ChatOperationError` with `GENERIC_CODES`.

### 6.4 Delivery & messaging
- WS delivery: `ApiGatewayManagementApi.postToConnection`; on `GoneException` purge stale connection.
- Offline fallback: reuse `sendPushNotification` with `NotificationType.CHAT_MESSAGE` (new type) + deep-link payload `{channelId}`.
- Rate limit: token counter per `(userId, minute)` in chat table or in-memory per-warm-Lambda; constant in `commons/libs/constants/ThrottlingLimits.ts`.

### 6.5 OpenAPI — `openapi/`
- New paths: `GET /chat/inbox`, `GET /chat/{channelId}/messages` (per **openapi-spec-change** + **add-backend-endpoint**): path json + integration json + VTL request/response templates + schema components + `CognitoAuthorizer` + request validator.
- WebSocket API is **not** in the HTTP OpenAPI doc (separate `apigatewayv2`); document its routes/contract in `docs/development/`.
- Validate: `make lint-api`, `make bundle-openapi`.

### 6.6 Tests (**write-backend-tests**)
- Handler tests mock the service + `ApiGateway` + `HttpLogger` (mirror `core/services/aws/tests/...`).
- Service tests with `core/application/tests/mocks/` fixtures (+ new `mockChatData.ts`).
- Cover: idempotent channel creation, locked-channel rejection, rate-limit, WS-vs-push branch, auth-deny. Meet `coverageThreshold.functions: 60`.

### 6.7 Docs
- `docs/development/Chat.rst` (architecture, WS contract, message lifecycle) + `docs/architecture/Database.rst` chat-table section. `make sphinx-html`.

### PR1 acceptance mapping
WS API ✓ · connect/disconnect/send/history Lambdas ✓ · DynamoDB + stream channel creation ✓ · WS-or-push delivery ✓ · locking ✓ · 90-day TTL ✓ · auth + rate-limit ✓ · TLS/at-rest encryption ✓ · OpenAPI ✓.

---

## 7. PR2 — Mobile (`clients/mobile`, follow **mobile-feature** skill)

- New workflow folder `clients/mobile/src/chatWorkflow/` with `UI/ChatInbox.tsx`, `UI/ChatRoom.tsx`, `hooks/`, `services/chatService.ts`, `context/`.
- **WebSocket client** (reconnect, heartbeat, offline send queue) under `setup/clients/` or `chatWorkflow/services`.
- **ChatInbox**: channel list, last-message preview, unread badges (from `GET /chat/inbox`).
- **ChatRoom**: sent/received bubbles, context header (blood request details), offline queue + flush on reconnect, **read-only banner** when `channel.locked`.
- Register screens in `setup/navigation/{routes.ts,navigationTypes.ts}` + `setup/constant/screens` (`SCREENS`); entry in `BottomNavigation`/`Navigator`.
- **"Chat" buttons** on donor cards in `myActivity/donorTracking` + `myActivity/myPosts`.
- **Push deep-link** handling in `setup/notification` → open correct `ChatRoom`.
- i18n keys in `setup/language/locales/{en,bn}`.
- Tests in `__tests__/` mirroring, `__mocks__/aws-amplify`. Mobile jest project.

---

## 8. Sequencing / milestones

**PR1 (backend)**
1. DTOs + constants (`commons`)
2. Chat table + stream + TTL (Terraform)
3. Domain layer (`chatWorkflow` service + ports + types + errors)
4. DDB models + operations (`add-dynamodb-model`)
5. Stream Lambdas: `createChatChannel`, `lockChatChannel` + pipes
6. WS API + authorizer + connect/disconnect/sendMessage
7. REST history/inbox + OpenAPI
8. Push fallback (`CHAT_MESSAGE` type, deep-link payload)
9. Tests + docs; `make lint && make test`

**PR2 (mobile)** — screens → navigation → WS client → buttons → deep-link → i18n → tests.

---

## 9. Open questions / risks

- **WS authorizer caching**: API GW WS authorizer cache TTL vs token expiry — confirm acceptable window.
- **Rate-limit store**: per-Lambda memory resets on cold start; DynamoDB counter is durable but adds writes. Default to DynamoDB counter; revisit if cost matters.
- **Channel membership in history auth**: enforce caller ∈ {seekerId, donorId} on every read.
- **Stream redelivery**: channel creation must stay idempotent (deterministic `channelId`).
- **`expiresAt` granularity**: DynamoDB TTL deletes within ~48h of expiry — fine for 90-day retention; note it's not exact.
- **Web clients** (`clients/organization`, `clients/monitoring`): out of scope (mobile-only per AC). Confirm.

---

## 10. Quality gates

`make lint` (lint-code + tf-validate + lint-api) · `make test` (jest --runInBand, functions≥60) · `make tf-security` (Checkov) · `make bundle-openapi` · local validation via **local-dev-localstack** (LocalStack + `make start-dev`).
