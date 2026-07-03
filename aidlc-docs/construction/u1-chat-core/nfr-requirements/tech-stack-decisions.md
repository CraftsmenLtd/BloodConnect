# U1 Chat Core — Tech Stack Decisions

| Concern | Decision | Rationale |
|---|---|---|
| Language | TypeScript (strict) | Repo standard; no `any`. |
| Persistence | DynamoDB single table via existing `DynamoDbTableOperations` base + `@aws-sdk/client-dynamodb` (already a dep) | Reuse; new `Chat*Model` extend the base. |
| Atomic dedup | `TransactWriteItems` (message + dedup guard) | Exactly-once per `(channelId, clientMessageId)` (PBT-04). |
| ID generation | `generateUniqueID()` (ULID) from `core/application/utils/idGenerator.ts` | Already used repo-wide; ULID is sortable. **No new dep.** |
| Rate limiting | DynamoDB atomic `ADD` counter, fixed 1-min window, ~120s TTL | Cheap; bounds to ~60/min (SECURITY-11). |
| **PBT framework** | **fast-check** (Jest-compatible) — **new devDependency** | PBT-09; integrates with existing ts-jest setup; supports custom generators, shrinking, seeds. |
| Unit test runner | Jest + ts-jest (existing) | Repo standard; ≥60% function coverage. |
| AWS mocking | `aws-sdk-client-mock` (existing dep) | Mock DynamoDB in tests. |
| Realtime delivery (port only at U1) | `RealtimeNotifier` interface; impl `@aws-sdk/client-apigatewaymanagementapi` in U3 | Keep domain AWS-agnostic. |

## New Dependencies to Add
- **`fast-check`** (devDependency) — property-based testing (PBT-09). Pin exact version + lock file
  (SECURITY-10). To be added in the workspace(s) that host chat tests (`core` services/application).

## Reused (no new dependency)
- `@aws-sdk/client-dynamodb`, `aws-sdk-client-mock`, `ulid` (via idGenerator), Jest/ts-jest, the
  `NosqlModel`/`DbModelDtoAdapter` framework, existing logger/config libs.

## PBT-09 Compliance
- Framework: **fast-check**; supports custom generators (chat domain types), automatic shrinking,
  seed-based reproducibility, Jest integration — satisfies PBT-09 verification criteria.
- Domain generators (PBT-07) for `ChatChannelDTO`/`ChatMessageDTO`/`ChatConnectionDTO`/ids to be
  defined as reusable test utilities during Code Generation.
