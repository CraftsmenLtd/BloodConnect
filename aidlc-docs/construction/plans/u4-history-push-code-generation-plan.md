# U4 History + Push — Code Generation Plan (single source of truth)

**Unit**: U4 History + Push. **Stories**: US-5 (history), US-10 (push backend). **Depends on**: U1
(`ChatMessageService`/`ChatChannelService`), U3 (`ChatPushNotifier` payload). **Conventions**: TS
strict, no `any`, single quotes/no semicolons/150-col; reuse REST envelope + existing notification path.

**Infra note**: REST route/integration Terraform + IAM **wired in U6**. U4 delivers code + OpenAPI + tests.

---

## Step 1 — Cursor helpers (domain, pure)
- [x] **CREATE** `core/application/chatWorkflow/cursor.ts` — `encodeCursor(key)` (base64 JSON),
  `decodeCursor(s)` (throws `ChatValidationError` on malformed), `clampLimit(limit)` → `[1,20]`.

## Step 2 — History event type
- [x] **MODIFY** `core/application/chatWorkflow/Types.ts` — add `GetChatHistoryEvent`
  (`{ requesterId, channelId, cursor?, limit? }`).

## Step 3 — REST handler
- [x] **CREATE** `core/services/aws/chat/chatGetHistory.ts` — build services; decode cursor + clamp
  limit; `ChatMessageService.getHistory`; encode `nextCursor`; `generateApiGatewayResponse`; error
  mapping via `ChatOperationError.errorCode`.

## Step 4 — Push completion (publish-only)
- [x] **MODIFY** `core/application/notificationWorkflow/NotificationService.ts` — add a `CHAT_MESSAGE`
  branch in `sendPushNotification` that **publishes only** (no `createNotification`), ordered before
  the generic `else`.

## Step 5 — OpenAPI
- [x] **CREATE** `openapi/paths/chat/history.json` (`GetChatHistory`, GET, query params, CognitoAuthorizer,
  request validator, integration `$ref`).
- [~] **DEFERRED to U6** `openapi/integration/aws/chat/get-history.json` — the integration (VTL request
  mapping injecting `requesterId` from claims, invocation-ARN placeholder) + root-doc registration is
  deploy wiring; authored in U6 alongside Terraform. U4 ships the path contract + response schema.
- [x] **CREATE** `openapi/components/schemas/chat/history-response.json` (response model).

## Step 6 — Tests
- [x] **CREATE** `core/application/tests/chatWorkflow/cursor.test.ts` (PBT: round-trip; clamp invariant;
  malformed cursor throws).
- [x] **CREATE** `core/services/aws/tests/chat/chatGetHistory.test.ts` (mock services: success +
  nextCursor; participant 403; malformed cursor 400).
- [x] **CREATE/EXTEND** notification test for the `CHAT_MESSAGE` publish-only branch (publish called,
  `createNotification` not called).

## Step 7 — Documentation
- [x] **CREATE** `aidlc-docs/construction/u4-history-push/code/u4-code-summary.md`.

---

## Story Traceability
| Story | Implemented by (U4) |
|---|---|
| US-5 | chatGetHistory + cursor helpers (ChatMessageService.getHistory) |
| US-10 (backend) | NotificationService CHAT_MESSAGE publish-only branch (payload from U3) |

## Extension Compliance Targets
- **PBT**: PBT-02 (cursor round-trip), PBT-03 (limit clamp invariant), PBT-10 (example + property).
- **Security**: SECURITY-05 (cursor/limit/channelId), -08 (cognito identity + participant), -15/-03
  (fail-closed/redact). IAM (-06) realized in U6.

## Scope
- ~3 source (1 modified) + 3 OpenAPI files + 3 test files + 1 doc. Terraform → U6.
