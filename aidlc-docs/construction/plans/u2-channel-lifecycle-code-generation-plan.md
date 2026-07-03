# U2 Channel Lifecycle — Code Generation Plan (single source of truth)

**Unit**: U2 Channel Lifecycle (DynamoDB-stream `chatChannelCreator`). **Project**: brownfield; modify
in place. **Stories**: US-1, US-2 (auto-create), US-3 (lock). **Depends on**: U1 (`ChatChannelService`,
`buildChannelId`) + existing `BloodDonationService` / `AcceptDonationService`.

**Conventions**: TS strict, no `any`, single quotes/no semicolons/150-col, arrow functions; reuse
existing handler-wiring style (`Config`, `createServiceLogger`, DynamoDB operations); fast-check + Jest.

**Infra note**: chat **Terraform** (stream event-source mapping, Lambda registration, IAM) is
**deferred to U6** (Infrastructure & Integration), per the execution plan — U6 wires it with the
WebSocket API and environment modules. U2 delivers the application code + tests; the U2 Infrastructure
Design doc is the spec U6 implements.

---

## Step 1 — Stream classifier (pure)
- [x] **CREATE** `core/application/chatWorkflow/streamClassifier.ts` — `LifecycleAction` enum
  (`CREATE_CHANNEL | LOCK_REQUEST_CHANNELS | NOOP`), `ClassifyInput`, `classifyStreamItem(...)`
  (uses `AcceptDonationStatus.ACCEPTED` / `DonationStatus.COMPLETED`), plus `parseAcceptanceKeys` /
  `parseRequestKeys` helpers.

## Step 2 — Domain service
- [x] **CREATE** `core/application/chatWorkflow/ChannelLifecycleService.ts` —
  `onAcceptanceAccepted(input, bloodDonationService, channelService)` (fetch request → context →
  `createChannelIfAbsent`), `onRequestCompleted(input, acceptDonationService, channelService)`
  (list accepted donors → `lockChannel` fan-out).

## Step 3 — Lambda handler (adapter)
- [x] **CREATE** `core/services/aws/chat/chatChannelCreator.ts` — `DynamoDBStreamEvent` →
  `DynamoDBBatchResponse`; `unmarshall` NewImage; classify; dispatch to lifecycle service; per-record
  try/catch → `batchItemFailures` (by `SequenceNumber`); builds services via `Config` + DynamoDB
  operations + `createServiceLogger`.

## Step 4 — Test utilities
- [x] **CREATE** `core/application/tests/chatWorkflow/streamClassifierArbitraries` (inline in test or
  reuse) — generators for `ClassifyInput`.

## Step 5 — Domain unit tests (example + PBT)
- [x] **CREATE** `core/application/tests/chatWorkflow/streamClassifier.test.ts` (PBT: total +
  deterministic; only ACCEPTED acceptance → CREATE; only COMPLETED request → LOCK; REMOVE/others →
  NOOP; key parse round-trip).
- [x] **CREATE** `core/application/tests/chatWorkflow/ChannelLifecycleService.test.ts` (example:
  create builds context from request + calls createChannelIfAbsent; complete fans out lockChannel
  per donor; idempotence via createChannelIfAbsent mock).

## Step 6 — Handler test
- [x] **CREATE** `core/services/aws/tests/chat/chatChannelCreator.test.ts` (mock services; ACCEPTED
  record → create path; COMPLETED request record → lock path; a throwing record → reported in
  `batchItemFailures`; irrelevant record → NOOP, no failure).

## Step 7 — Documentation
- [x] **CREATE** `aidlc-docs/construction/u2-channel-lifecycle/code/u2-code-summary.md`.

---

## Story Traceability
| Story | Implemented by (U2) |
|---|---|
| US-1, US-2 | classifyStreamItem(CREATE) + ChannelLifecycleService.onAcceptanceAccepted + handler |
| US-3 | classifyStreamItem(LOCK) + ChannelLifecycleService.onRequestCompleted (fan-out) + handler |

## Extension Compliance Targets (verified at end of Part 2)
- **PBT**: PBT-03 (classifier total/deterministic), PBT-04 (idempotent create under duplicate events),
  PBT-02 (key parse round-trip), PBT-10 (example + property).
- **Security**: SECURITY-15 (fail-closed + partial-batch-failure), SECURITY-03 (no PII/body in logs).
  IAM (SECURITY-06) realized in U6 Terraform.

## Scope
- **3 source files + 3 test files + 1 doc.** Terraform deferred to U6. Tests run in Build & Test
  (and verified now via `jest`/`tsc`/`eslint`).
