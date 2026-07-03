# U2 Channel Lifecycle — Code Generation Summary

**Status**: Generated and verified. **Tests**: 13 passing (3 suites). **Type-check**: no U2 errors.
**ESLint**: clean (source + tests).

## Created — Domain (`core/application/chatWorkflow/`)
- `streamClassifier.ts` — `LifecycleAction` enum, `classifyStreamItem` (uses real
  `AcceptDonationStatus.ACCEPTED` / `DonationStatus.COMPLETED`), `parseAcceptanceKeys`,
  `parseRequestKeys`.
- `ChannelLifecycleService.ts` — `onAcceptanceAccepted` (request → context snapshot →
  `createChannelIfAbsent`), `onRequestCompleted` (accepted donors → `lockChannel` fan-out).

## Created — Adapter (`core/services/aws/chat/`)
- `chatChannelCreator.ts` — `DynamoDBStreamEvent → DynamoDBBatchResponse`; `unmarshall` NewImage;
  classify + dispatch; per-record try/catch → `batchItemFailures` (by `SequenceNumber`).

## Created — Tests
- `core/application/tests/chatWorkflow/streamClassifier.test.ts` — PBT (total/deterministic mapping;
  CREATE only for ACCEPTED acceptance; LOCK only for COMPLETED request; NOOP otherwise) + key
  parse round-trip PBT.
- `core/application/tests/chatWorkflow/ChannelLifecycleService.test.ts` — context-from-request +
  create; lock fan-out per donor; empty-donor no-op.
- `core/services/aws/tests/chat/chatChannelCreator.test.ts` — create path, lock path, irrelevant
  record NOOP, throwing record → `batchItemFailures` (retry).

## Key correction realized in code (vs ticket assumption)
- Lock trigger is the **donation-request** row → `COMPLETED` (the acceptance row never changes on
  completion); lock **fans out** to all accepted donors of that request.

## Deferred to U6 (Infrastructure & Integration)
- DynamoDB **stream event-source mapping** (`ReportBatchItemFailures`, `filter_criteria` on SK
  prefixes `ACCEPTED#`/`BLOOD_REQ#`, `starting_position = LATEST`).
- `chat-channel-creator` Lambda registration + least-privilege IAM (stream read + table/GSI1 actions).
- LocalStack parity.

## Extension compliance
- **PBT**: PBT-03 (total/deterministic classifier), PBT-02 (key round-trip), PBT-10 (example +
  property). PBT-04 (idempotent create) covered by U1's `createChannelIfAbsent`. ✅
- **Security**: SECURITY-15 (fail-closed + partial-batch-failure), SECURITY-03 (no PII/body in logs).
  IAM (SECURITY-06) realized in U6. ✅

## Story coverage
US-1, US-2 (auto-create on ACCEPTED), US-3 (lock on COMPLETED, fan-out).
