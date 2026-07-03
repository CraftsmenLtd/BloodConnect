# Unit Dependency Matrix & Sequence — Issue #571 (In-app Chat)

## Dependency Matrix
| Unit | Depends On | Depended On By | Change Scope |
|---|---|---|---|
| U1 Chat Core | — | U2, U3, U4, U5, U6 | Major (new contracts) |
| U2 Channel Lifecycle | U1 | U6 | Major (new stream consumer) |
| U3 Real-time Messaging | U1 | U4, U5, U6 | Major (new WebSocket handlers) |
| U4 History + Push | U1, U3 | U5, U6 | Minor/Major (REST + reuse push) |
| U5 Mobile Client | U3, U4 | — | Major (new screens/hooks) |
| U6 Infra & Integration | U2, U3, U4 | — | Major (new WebSocket API + stream mapping) |

## Build / Update Sequence
```
Phase 1:  U1 (foundation)
Phase 2:  U2  ||  U3        (parallel; both depend only on U1)
Phase 3:  U4                (needs U3 send/offline-detection)
Phase 4:  U5                (needs U3 + U4 contracts)
Across:   U6 infra authored alongside U2/U3/U4; finalized before Build & Test
```
- **Critical path**: U1 → U3 → U4 → U5.
- **Parallelizable**: U2 with U3; U6 Terraform stubs can start once U2/U3 resource shapes are known.

## Coordination Points (contracts that must be stable before dependents proceed)
1. **Chat DTOs** (U1) — consumed by all.
2. **WebSocket message/event envelope schema** (U3) — consumed by U4 (push payload) and U5 (client).
3. **REST `getHistory` OpenAPI contract** (U4) — consumed by U5.
4. **`NotificationType.CHAT_MESSAGE` + payload** (U1/U4) — consumed by push path + U5 deep-link.
5. **DynamoDB key/GSI schema** (U1 Functional Design) — consumed by U2/U3/U4 operations + U6 IAM.

## Testing Checkpoints
- **Per unit**: unit + PBT tests (≥60% functions).
- **After U3**: WebSocket connect/send/authz integration (LocalStack).
- **After U4**: history + push fallback integration.
- **After U5 + U6**: end-to-end (accept → channel → message → push → history → lock) on LocalStack.

## Rollback Strategy
- Feature is additive and isolatable: disable the WebSocket API stage + the DynamoDB stream
  event-source mapping (U6) to neutralize chat; chat items are TTL'd; no existing item shapes or
  flows are modified, so no destructive migration to revert.
