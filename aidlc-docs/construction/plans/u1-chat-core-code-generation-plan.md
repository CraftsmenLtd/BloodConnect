# U1 Chat Core — Code Generation Plan (single source of truth)

**Unit**: U1 Chat Core (data + domain foundation). **Project**: brownfield monorepo; modify in place,
no duplicate files. **Stories**: U1 is the enabler for US-1..US-12 (no standalone story; provides the
contracts/logic the other units consume). **Dependencies**: none (foundation). **Downstream**: U2/U3/U4/U5/U6.

**Conventions**: TS strict, no `any`, single quotes, no semicolons, 150-col, arrow functions; reuse
`DynamoDbTableOperations` base, `generateUniqueID()` (ulid), existing logger/config; fast-check + Jest
for tests (PBT-08/10); aws-sdk-client-mock for operations.

---

## Step 1 — Shared DTOs (contracts)
- [x] **CREATE** `commons/dto/ChatDTO.ts` — `ChatChannelStatus` (`OPEN|LOCKED`), `ChatChannelContext`,
  `ChatChannelDTO`, `ChannelMembershipDTO`, `ChatMessageDTO`, `ChatConnectionDTO`,
  `ChatRealtimeEvent` (`MESSAGE|TYPING|READ_RECEIPT`).
- [x] **MODIFY** `commons/dto/NotificationDTO.ts` — add `CHAT_MESSAGE = 'CHAT_MESSAGE'` to `NotificationType` (SI-2).

## Step 2 — Domain ports (interfaces)
- [x] **CREATE** `core/application/models/policies/repositories/ChatChannelRepository.ts`
- [x] **CREATE** `core/application/models/policies/repositories/ChatMessageRepository.ts`
- [x] **CREATE** `core/application/models/policies/repositories/ChatConnectionRepository.ts`
- [x] **CREATE** `core/application/models/realtime/RealtimeNotifier.ts` (port; impl in U3)

## Step 3 — Business Logic Generation (domain services)
- [x] **CREATE** `core/application/chatWorkflow/Types.ts` (attribute/input types, `ChatChannelContext`)
- [x] **CREATE** `core/application/chatWorkflow/ChatOperationError.ts` (taxonomy: NotFound/Forbidden/Conflict/Validation/Throttling, mirrors `NotificationOperationError`)
- [x] **CREATE** `core/application/chatWorkflow/validation.ts` (`validateBody`, `validateIds`; BR-5/BR-14, SECURITY-05)
- [x] **CREATE** `core/application/chatWorkflow/ChatChannelService.ts` (createChannelIfAbsent, lockChannel, getChannel, listChannelsForUser, assertParticipant) — US-1/US-3/US-9/US-11
- [x] **CREATE** `core/application/chatWorkflow/ChatMessageService.ts` (sendMessage, getHistory, markRead, getUnreadCount, assertWithinRateLimit) — US-4/US-5/US-8/US-9/US-12
- [x] **CREATE** `core/application/chatWorkflow/ChatConnectionService.ts` (registerConnection, removeConnection, getConnectionsForUser, isUserConnected) — US-11/FR-8

## Step 4 — Repository Layer Generation (DynamoDB adapters)
- [x] **CREATE** `core/services/aws/commons/ddbModels/ChatChannelModel.ts` (META: `CHAT_CHANNEL#<channelId>`/`META`)
- [x] **CREATE** `core/services/aws/commons/ddbModels/ChatChannelMembershipModel.ts` (`CHAT_USER#<userId>`/`CHANNEL#<channelId>` + GSI1)
- [x] **CREATE** `core/services/aws/commons/ddbModels/ChatMessageModel.ts` (`CHAT_MSG#<channelId>`/`MSG#<sentAt>#<messageId>`)
- [x] **CREATE** `core/services/aws/commons/ddbModels/ChatConnectionModel.ts` (`CHAT_CONN#<connectionId>`/`META` + GSI1)
- [x] **CREATE** `core/services/aws/commons/ddbOperations/ChatChannelDynamoDbOperations.ts` (implements ChatChannelRepository: create META+2 memberships, conditional create, updateStatus, updateLastMessage, queryByUser via GSI1, read-state upsert/get)
- [x] **CREATE** `core/services/aws/commons/ddbOperations/ChatMessageDynamoDbOperations.ts` (implements ChatMessageRepository: `TransactWriteCommand` message+dedup guard, queryByChannel newest-first, countSince, rate-counter atomic ADD)
- [x] **CREATE** `core/services/aws/commons/ddbOperations/ChatConnectionDynamoDbOperations.ts` (implements ChatConnectionRepository)

## Step 5 — Deployment Artifacts (infra changes owned by U1)
- [x] **MODIFY** `iac/terraform/aws/dynamodb/dynamodb.tf` — add `ttl { attribute_name = "ttl"  enabled = true }` (SI-1)
- [x] **MIRROR** the same TTL in the LocalStack table definition if it has its own (check `deployment/localstack`); otherwise N/A
- [x] **MODIFY** `package.json` (appropriate workspace) — add `fast-check` devDependency (pinned) (PBT-09, SECURITY-10)

## Step 6 — Test utilities (fast-check generators, PBT-07)
- [x] **CREATE** `core/application/tests/utils/chatGenerators.ts` — arbitraries: `idArb`, `bodyArb`, `chatChannelArb`, `chatMessageArb`, `chatConnectionArb`, `membershipArb`

## Step 7 — Business Logic Unit Testing (services: example + PBT)
- [x] **CREATE** `core/application/tests/chatWorkflow/validation.test.ts` (PBT: body bound, id allowlist)
- [x] **CREATE** `core/application/tests/chatWorkflow/ChatChannelService.test.ts` (example: create/lock/assertParticipant 403; PBT: create idempotence, state machine OPEN→LOCKED)
- [x] **CREATE** `core/application/tests/chatWorkflow/ChatMessageService.test.ts` (example: locked→409, non-participant→403, rate-limit→throttle, push-if-offline; PBT: dedup idempotence, unread≥0, history newest-first, unread under send/markRead sequences)
- [x] **CREATE** `core/application/tests/chatWorkflow/ChatConnectionService.test.ts` (example + isUserConnected)

## Step 8 — Repository Layer Unit Testing (round-trip PBT + ops)
- [x] **CREATE** `core/services/aws/tests/dbModels/ChatChannelModel.test.ts` (round-trip PBT)
- [x] **CREATE** `core/services/aws/tests/dbModels/ChatChannelMembershipModel.test.ts` (round-trip PBT)
- [x] **CREATE** `core/services/aws/tests/dbModels/ChatMessageModel.test.ts` (round-trip PBT)
- [x] **CREATE** `core/services/aws/tests/dbModels/ChatConnectionModel.test.ts` (round-trip PBT)
- [x] **CREATE** `core/services/aws/tests/commons/ddb/ChatMessageDynamoDbOperations.test.ts` (aws-sdk-client-mock: transact dedup → returns existing on duplicate; history reverse scan)

## Step 9 — Documentation
- [x] **CREATE** `aidlc-docs/construction/u1-chat-core/code/u1-code-summary.md` (files created/modified, mapping to BRs/stories, PBT + Security compliance summary)

---

## Story Traceability
| Story | Implemented by (U1 portion) |
|---|---|
| US-1, US-2 | ChatChannelService.createChannelIfAbsent + ChatChannelDynamoDbOperations |
| US-3 | ChatChannelService.lockChannel + state machine |
| US-4 | ChatMessageService.sendMessage + validation |
| US-5 | ChatMessageService.getHistory |
| US-8 | ChatMessageService.markRead |
| US-9 | ChatMessageService.getUnreadCount + ChatChannelService.listChannelsForUser |
| US-11 | assertParticipant + ChatConnectionService |
| US-12 | ChatMessageService.assertWithinRateLimit |
| US-6 (foundation) | dedup-guard transaction in ChatMessageDynamoDbOperations |

## Extension Compliance Targets (verified at end of Part 2)
- **PBT**: PBT-02 (round-trip ×4 models), PBT-03 (invariants: unread≥0, history order, body bound),
  PBT-04 (idempotence: create, dedup), PBT-06 (stateful: channel state machine, unread under seq),
  PBT-07 (domain generators), PBT-08 (shrinking on, seed logged), PBT-10 (example + PBT).
- **Security**: SECURITY-05 (validation), -08 (assertParticipant), -11 (rate limit), -15 (fail-closed),
  -01 (TTL/encryption infra), -10 (pinned fast-check). Compliance summary in u1-code-summary.md.

## Scope / Estimate
- **~25 files** (≈18 source + Terraform/pkg changes + ~9 test files + 1 doc). Tests authored here;
  executed in **Build & Test**. No handlers/WebSocket/stream in U1 (those are U2/U3).
