# U2 Channel Lifecycle — Logical Components

## New (domain — `core/application/chatWorkflow/`)
- **`classifyStreamItem(input)`** — pure mapper → `CREATE_CHANNEL | LOCK_REQUEST_CHANNELS | NOOP`.
- **`ChannelLifecycleService`** — `onAcceptanceAccepted(...)`, `onRequestCompleted(...)`; depends on
  `ChatChannelService` (U1), `BloodDonationService`, `AcceptDonationService` (existing). AWS-agnostic.

## New (adapter — `core/services/aws/chat/`) — authored in U2 Code Gen
- **`chatChannelCreator`** Lambda (`DynamoDBStreamHandler`) — unmarshalls images, derives keys,
  invokes the lifecycle service, returns `{ batchItemFailures }`. Builds services with injected
  DynamoDB operations + logger/config (same wiring style as existing handlers).

## Reused (no new infra component)
- U1: `ChatChannelService`, `ChatChannelDynamoDbOperations`.
- Existing: `BloodDonationService` + `BloodDonationDynamoDbOperations`, `AcceptDonationService` +
  `AcceptDonationDynamoDbOperations`, `Config`, logger.

## Deferred infrastructure (declared in U2 Infrastructure Design)
- DynamoDB **stream event-source mapping** → `chatChannelCreator` (`ReportBatchItemFailures`).
- Least-privilege IAM (stream read + table/GSI1 read/write).
- LocalStack parity (consumed by U6 consolidation).

## Component Interaction (logical)
```
DynamoDB Stream -> chatChannelCreator (adapter)
   -> classifyStreamItem (pure)
   -> ChannelLifecycleService
        CREATE: BloodDonationService.getDonationRequest -> ChatChannelService.createChannelIfAbsent
        LOCK:   AcceptDonationService.getAcceptedDonorList -> ChatChannelService.lockChannel (xN)
```
