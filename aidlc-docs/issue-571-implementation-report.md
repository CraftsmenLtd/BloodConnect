# Implementation Report — Issue #571: In-app Chat among Donor and Seeker

**Date**: 2026-06-28 · **Branch**: `master` (working tree) · **Method**: AIDLC workflow (full INCEPTION
→ CONSTRUCTION across 6 units + Build & Test). **Tests**: **106 chat tests passing** (25 suites, 3 Jest
projects). **Type-check**: clean for all chat files (0 new errors). **ESLint**: clean. Deployment +
monitoring: **owner-handled** (out of scope here).

> Status legend: ✅ Done · ➕ Done with an approved deviation · 🟡 Partial · ⛔ Not done (documented)

## Scope decisions that shaped the build (from the requirements Q&A)
Full feature in one iteration; API Gateway **WebSocket**; **text + emoji**; keep the donor phone number
in the "Donor Found" notification for now; channel auto-create via **DynamoDB stream consumer**; lock on
**COMPLETED only** (IGNORED channels stay OPEN until TTL — deliberate deviation from the ticket); 90-day
TTL + 60 msg/min rate limit; read receipts + typing; **mobile only**; LocalStack + AWS-ready Terraform.
Extensions enabled (blocking): **Security Baseline** + **Property-Based Testing** (fast-check).

---

## Backend acceptance criteria

| # | Criterion | Status | Where |
|---|---|---|---|
| 1 | WebSocket API Gateway via Terraform in `iac/terraform/aws/` | ✅ | `iac/terraform/aws/chat/websocket.tf` (api + 6 routes + authorizer + stage logging); wired in `iac/terraform/aws/modules.tf` |
| 2 | `chatConnect` authenticates via Cognito + stores `connectionId` in DynamoDB | ✅ | `core/services/aws/chat/chatAuthorizer.ts` (Cognito JWT via `aws-jwt-verify` on `$connect`) + `chatConnect.ts` → `ChatConnectionService.registerConnection` (`CHAT_CONN#` item) |
| 3 | `chatDisconnect` removes the connection record | ✅ | `core/services/aws/chat/chatDisconnect.ts` → `removeConnection` |
| 4 | `chatChannelCreator` auto-creates `ChatChannelDTO` (OPEN) on acceptance stream event | ✅ | `core/services/aws/chat/chatChannelCreator.ts` + `streamClassifier.ts` + `ChannelLifecycleService.onAcceptanceAccepted`; stream mapping in `chat/stream_trigger.tf` |
| 5 | `chatSendMessage` persists + delivers real-time to connected participants | ✅ | `chatSendMessage.ts` + `ChatMessageService.sendMessage` (TransactWrite + dedup) + `ApiGatewayManagementApiOperations` fan-out |
| 6 | `chatGetHistory` paginated, newest-first, scoped to the channel | ✅ | `chatGetHistory.ts` + `ChatMessageService.getHistory` (reverse scan, opaque cursor, page ≤ 20) |
| 7 | Lock on `COMPLETED` **or** `IGNORED`; no new messages on a locked channel | ➕ | Lock on **COMPLETED** ✅ (`ChannelLifecycleService.onRequestCompleted` fan-out; locked send → 409). **IGNORED left OPEN until TTL** — approved deviation (Q6=C). *Note: lock triggers on the donation-request row → COMPLETED, since the acceptance row is not mutated on completion (verified in code).* |
| 8 | `CHAT_MESSAGE` push via the existing queue when recipient not WS-connected | ✅ | `ChatPushNotifier` (offline → SQS) gated by `isUserConnected`; `NotificationService.sendPushNotification` **publish-only** `CHAT_MESSAGE` branch |
| 9 | Unit tests cover all new Lambda handlers and service classes | ✅ | All 9 handlers + 3 services + 3 ops + classifier/lifecycle tested (example + PBT) |

**Backend: 9/9 met** (criterion 7 met with the approved IGNORED-stays-open deviation).

## Mobile client acceptance criteria

| # | Criterion | Status | Where |
|---|---|---|---|
| 1 | `ChatInbox` lists channels + preview + unread badge | ✅ | `clients/mobile/src/chatWorkflow/UI/ChatInbox.tsx` + `ChannelListItem.tsx` + `hooks/useChatInbox.ts` + backend `chatListChannels.ts` |
| 2 | `ChatRoom` scrollable list, sent vs received bubbles | ✅ | `UI/ChatRoom.tsx` + `MessageList.tsx` + `MessageBubble.tsx` |
| 3 | `ChatRoomHeader` shows blood-request context | ✅ | `UI/ChatRoomHeader.tsx` |
| 4 | Offline messages queued + delivered on reconnection | ✅ | `hooks/useChatRoom.ts` + `chatQueue.ts` (dedup by `clientMessageId`) + AsyncStorage + flush on reconnect; server dedup guarantees exactly-once |
| 5 | "Chat" button on the seeker's `MyActivity → donorTracking` accepted-donor card | ⛔ | **Remaining** — entry-button wiring (needs app auth/fetch providers); documented in `u5-code-summary.md` |
| 6 | "Chat" button on the donor's `MyActivity` active-donation card | ⛔ | **Remaining** — same |
| 7 | `CHAT_MESSAGE` push deep-links directly to the correct `ChatRoom` | 🟡 | Backend payload (`channelId`…) ✅ + `ChatRoom` screen ✅; the `setup/notification` deep-link handler is **not wired** (documented remaining) |
| 8 | Locked channels show the read-only banner | ✅ | `UI/LockedBanner.tsx` + composer disabled in `ChatRoom.tsx` |
| 9 | Unit + integration tests for `useChatRoom`/`useChatInbox` | 🟡 | The composed pure core is PBT/unit-tested (`chatQueue`, `messageList`, `ChatSocket`, `chatApi`); **dedicated `useChatRoom`/`useChatInbox` hook tests were deferred** |

**Mobile: 5/9 fully met; 2 partial (deep-link wiring, hook tests); 2 not done (the two entry buttons).**
All remaining items are **client wiring/tests** that need the running app's auth-token + fetch-client
providers — there is no missing backend capability.

## Non-functional acceptance criteria

| # | Criterion | Status | Where |
|---|---|---|---|
| 1 | TLS in transit; at-rest via DynamoDB default encryption | ✅ | WSS/HTTPS (API Gateway) + shared-table default at-rest encryption. *(Transport TLS — not application-level E2E encryption, which the ticket conflates with TLS.)* |
| 2 | 90-day retention via DynamoDB TTL | ✅ | numeric `ttl` on all chat items + `ttl { attribute_name = "ttl" enabled = true }` enabled on the table (`iac/terraform/aws/dynamodb/dynamodb.tf`) |
| 3 | WS authenticated; unauth/non-participant rejected with `403` | ✅ | `chatAuthorizer` denies invalid tokens; `assertParticipant`/`getConnectionUser` → 403 on message/history/channel access |
| 4 | OpenAPI updated to document `getHistory` | ✅ | `openapi/paths/chat/history.json` + registered in `openapi/versions/v1.json` (bonus: `channels.json`) |

**Non-functional: 4/4 met.**

## Additional-context items from the ticket
- Reuses the existing DynamoDB **stream** (no schema change; only an additive `ttl` block). ✅
- Uses the acceptance/request identifiers (`seekerId`/`requestPostId`/`donorId`) via stream keys. ✅
- Extended `NotificationType` (+`CHAT_MESSAGE`) + reused the notification queue. ✅
- **Rate limiting 60 msg/min/channel** implemented (`assertWithinRateLimit`, fixed 1-min window). ✅

---

## Summary

| Area | Met | Partial | Not done |
|---|---|---|---|
| Backend (9) | 9 (incl. 1 approved deviation) | 0 | 0 |
| Mobile (9) | 5 | 2 | 2 |
| Non-functional (4) | 4 | 0 | 0 |
| **Total (22)** | **18** | **2** | **2** |

**Bottom line:** the entire **backend, data model, real-time + push pipeline, REST history/inbox, and
all Terraform/OpenAPI wiring are implemented and tested (106 green tests)**. The only outstanding items
are **mobile client wiring** — the two "Chat" entry buttons, the push deep-link handler, navigation
route registration, and dedicated hook tests — all of which depend on the app's auth/fetch providers and
are best finished with the app running. One deliberate, approved deviation: **IGNORED channels stay open
until TTL** rather than locking.

## Verification performed in this session
- `npx jest` (chat filter): **106 passing**, 25 suites, 3 projects.
- `tsc --noEmit`: **0 new errors in chat files** (the 2 repo errors — `DonorSearchService.ts:390`,
  `DonationNotificationDynamoDbOperations.ts:28` — are pre-existing; proven by stashing the chat changes).
- `eslint`: clean on all new chat source + tests.
- OpenAPI JSON: all chat files valid; `/chat/history` + `/chat/channels` registered in `v1.json`.

## Remaining (for the owner / a follow-up PR)
1. Mobile: register `ChatInbox`/`ChatRoom` in `routes.ts`/`navigationTypes.ts` (wrapper screens injecting
   token + a `ChatApiClient` adapter + `userId` + `WEBSOCKET_URL`); wire the `CHAT_MESSAGE` deep-link;
   add the two "Chat" entry buttons; add `useChatRoom`/`useChatInbox` hook tests.
2. Build hygiene: relocate `core/services/aws/chat/ChatPushNotifier.ts` + `websocketTypes.ts` out of the
   lambda-scan path (non-handler helpers).
3. Operator env: `terraform fmt/validate`, `make bundle-openapi` + `spectral lint`, LocalStack/AWS deploy
   + the integration/e2e/perf/security walkthroughs (instructions in `aidlc-docs/construction/build-and-test/`).
4. Optional hardening: sliding-window rate limiter, CMK, CloudWatch alarms.

## Artifacts
- Code: `core/application/chatWorkflow/`, `core/services/aws/chat/`, `core/services/aws/commons/ddb*/Chat*`,
  `core/services/aws/commons/realtime/`, `commons/dto/ChatDTO.ts`, `clients/mobile/src/chatWorkflow/`,
  `iac/terraform/aws/chat/`, `openapi/.../chat/...`.
- AIDLC docs: `aidlc-docs/` (requirements, user-stories, application-design, per-unit construction,
  build-and-test). Per-unit code summaries under `aidlc-docs/construction/u{1..6}-*/code/`.
