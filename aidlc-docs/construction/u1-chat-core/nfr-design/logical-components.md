# U1 Chat Core — Logical Components

> Logical (not infrastructure) components for U1. New AWS infrastructure (WebSocket API, stream
> mapping, SQS) is **not** part of U1 — see U3/U4/U6.

## Domain layer (`core/application/chatWorkflow/`)
- **ChatChannelService** — lifecycle, inbox, participant assertion.
- **ChatMessageService** — send, history, read receipts, unread, rate-limit.
- **ChatConnectionService** — connection registry queries.
- **Ports**: `ChatChannelRepository`, `ChatMessageRepository`, `ChatConnectionRepository`,
  `RealtimeNotifier`.
- **Validation module** — `validateBody`, `validateIds` (SECURITY-05).
- **Error types** — `ChatNotFoundError`, `ChatForbiddenError`, `ChatConflictError`,
  `ChatValidationError`, `ChatThrottlingError`.

## Persistence adapters (`core/services/aws/commons/`)
- **ChatChannelModel** + **ChatChannelDynamoDbOperations** (META + membership items; GSI1 inbox).
- **ChatMessageModel** + **ChatMessageDynamoDbOperations** (message + dedup transaction; history;
  countSince; rate-counter ADD).
- **ChatConnectionModel** + **ChatConnectionDynamoDbOperations** (CONN item; GSI1 by user).
- All extend the existing **`DynamoDbTableOperations`** base.

## Shared (`commons/dto/`)
- `ChatChannelDTO`, `ChatMessageDTO`, `ChatConnectionDTO`, `ChatChannelStatus`, realtime event types;
  `NotificationType.CHAT_MESSAGE` (enum extension).

## Test components (`core/.../tests/`)
- **fast-check generators** (PBT-07): `chatChannelArb`, `chatMessageArb`, `chatConnectionArb`,
  `idArb`, `bodyArb` — reusable utilities.
- PBT suites (round-trip / invariant / idempotence / stateful) + example-based suites (PBT-10).

## Component Interaction (logical)
```
ChatMessageService --uses--> ChatChannelService (getChannel/assertParticipant)
ChatMessageService --port--> ChatMessageRepository (Transact + query)
ChatMessageService --port--> RealtimeNotifier (broadcast)        [impl in U3]
ChatMessageService --port--> ChatConnectionService (isUserConnected)
Channel/Message/Connection Services --ports--> *Repository --impl--> *DynamoDbOperations --> DynamoDB
```

## Reused infrastructure (no new component at U1)
- DynamoDB single table (encrypted, streams on), `DynamoDbTableOperations`, logger/config libs,
  `generateUniqueID()` (ULID).

## Deferred infrastructure (declared later)
- WebSocket API + routes + authorizer, ApiGatewayManagementApi adapter (U3).
- DynamoDB stream event-source mapping (U2/U6).
- SQS push reuse + `CHAT_MESSAGE` (U4).
- IAM, log retention, alarms, LocalStack parity (U6).
