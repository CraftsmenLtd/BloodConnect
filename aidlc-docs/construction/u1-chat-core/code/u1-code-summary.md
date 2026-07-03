# U1 Chat Core — Code Generation Summary

**Status**: Generated and verified. **Tests**: 48 passing (9 suites). **Type-check**: no errors in any
chat file. **ESLint**: clean (source + tests). **fast-check**: installed (3.23.2).

## Created — Shared DTOs
- `commons/dto/ChatDTO.ts` — `ChatChannelStatus`, `ChatChannelContext`, `ChatChannelDTO`,
  `ChannelMembershipDTO`, `ChatMessageDTO`, `ChatConnectionDTO`, `ChatRealtimeEvent(Type)`.

## Modified
- `commons/dto/NotificationDTO.ts` — added `NotificationType.CHAT_MESSAGE` (SI-2).
- `commons/libs/constants/GenericCodes.ts` — added `FORBIDDEN: 403`, `CONFLICT: 409` (needed for
  the ticket's 403 + locked-channel 409 responses).
- `iac/terraform/aws/dynamodb/dynamodb.tf` — added `ttl { attribute_name = "ttl" enabled = true }`
  (SI-1; covers AWS + LocalStack which reuse this module).
- `package.json` — added `fast-check@^3.23.1` devDependency (PBT-09).

## Created — Domain (`core/application/chatWorkflow/`)
- `Types.ts` — inputs, constants (TTLs, limits), `buildChannelId`/`parseChannelId`, helpers.
- `ChatOperationError.ts` — error taxonomy (NotFound/Forbidden/Conflict/Validation/TooManyRequests).
- `validation.ts` — `validateBody`, `validateIds`, `validateChannelId` (composite), control-char check.
- `ChatChannelService.ts`, `ChatMessageService.ts`, `ChatConnectionService.ts`.

## Created — Ports
- `core/application/models/policies/repositories/ChatChannelRepository.ts`,
  `ChatMessageRepository.ts`, `ChatConnectionRepository.ts`.
- `core/application/models/realtime/RealtimeNotifier.ts` — `RealtimeNotifier` + `OfflineNotifier`.

## Created — Persistence adapters (`core/services/aws/commons/`)
- `ddbModels/ChatChannelModel.ts`, `ChatChannelMembershipModel.ts`, `ChatMessageModel.ts`,
  `ChatConnectionModel.ts`.
- `ddbOperations/ChatChannelDynamoDbOperations.ts` (META + membership, transactional create),
  `ChatMessageDynamoDbOperations.ts` (TransactWrite dedup, history, countSince, rate ADD),
  `ChatConnectionDynamoDbOperations.ts`.

## Created — Tests
- `core/application/tests/utils/chatGenerators.ts` + `core/services/aws/tests/mock/chatArbitraries.ts`
  (fast-check generators, PBT-07).
- `core/application/tests/chatWorkflow/`: `validation.test.ts`, `ChatChannelService.test.ts`,
  `ChatConnectionService.test.ts`, `ChatMessageService.test.ts`.
- `core/services/aws/tests/dbModels/`: round-trip PBT for all 4 models.
- `core/services/aws/tests/commons/ddb/ChatMessageDynamoDbOperations.test.ts` (transact dedup, rate,
  history ordering).

## Bugs caught & fixed during generation
1. **Jest module resolution** — converted runtime value imports of `commons/dto/ChatDTO` from bare to
   relative paths (bare only works for type-only imports that Jest erases).
2. **channelId validation** — `channelId` is composite (`requestPostId#donorId`) so it legitimately
   contains `#`; added `validateChannelId` instead of the strict id pattern that forbids `#`.

## Extension compliance
- **PBT** — PBT-02 (round-trip ×4 models), PBT-03 (unread ≥ 0, body bound, history ordering),
  PBT-04 (channel create idempotence, message dedup), PBT-06 (channel state machine OPEN→LOCKED),
  PBT-07 (domain generators), PBT-09 (fast-check), PBT-10 (example + property tests). ✅
- **Security** — SECURITY-05 (validation/length bounds), -08 (`assertParticipant`, no IDOR),
  -11 (rate limit + isolated chat-auth), -15 (fail-closed taxonomy), -01 (TTL + default at-rest
  encryption), -10 (pinned fast-check + lockfile). ✅ (-02/-06/-14 → U6.)

## Story coverage (U1 portions)
US-1, US-2 (create), US-3 (lock), US-4 (send/validation), US-5 (history), US-8 (markRead),
US-9 (unread/list), US-11 (participant authz), US-12 (rate limit), US-6 foundation (dedup).

## Not in U1 (later units)
Lambda handlers, WebSocket API + authorizer, DynamoDB stream consumer, REST history endpoint +
OpenAPI, push payload builder, ApiGatewayManagementApi `RealtimeNotifier` impl, mobile client.
