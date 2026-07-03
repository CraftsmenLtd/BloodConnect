# Unit Test Execution — In-app Chat

## Run all chat unit + property tests
```bash
# whole suite
npm test

# chat only (across the 3 jest projects: core/application, core/services/aws, clients/mobile)
npx jest -i chatWorkflow "chat/" dbModels/Chat ChatMessageDynamoDbOperations realtime \
  notificationWorkflow/NotificationService chatListChannels
```

## Expected
- **106 chat tests pass, 0 failures** (25 suites) as of this iteration.
- Coverage threshold: **≥ 60% functions** (repo `jest.config.ts` global).
- Property-based tests (fast-check) run with shrinking enabled; on failure the seed + shrunk case are printed (PBT-08).

## What the unit tests cover (PBT-10: example + property)
- **U1**: DTO↔item round-trip (×4 models, PBT-02), validation bounds, channel state machine OPEN→LOCKED (PBT-06), create idempotence + message dedup (PBT-04), unread ≥ 0 + newest-first history (PBT-03), transact-dedup ops.
- **U2**: `classifyStreamItem` total/deterministic + key round-trip; lifecycle create/lock fan-out; handler create/lock/partial-failure/noop.
- **U3**: WS frame round-trip; `ApiGatewayManagementApiOperations` GoneException→stale; authorizer valid/invalid/missing; connect/disconnect; sendMessage dispatch + 403 + malformed.
- **U4**: cursor round-trip + limit clamp; `chatGetHistory` 200/403/400; `CHAT_MESSAGE` publish-only + COMMON-persists regression.
- **U5**: `chatQueue` dedup/uniqueness; `messageList` ordering + unread≥0 + echo replacement; `ChatSocket`; `chatApi`; backend `chatListChannels` 200/400.

## If tests fail
1. Read the jest output (failing suite + shrunk PBT seed).
2. Fix the code; re-run the targeted suite (`npx jest <name>`).
3. Re-run the full chat filter above until green.
