# U2 Channel Lifecycle — Tech Stack Decisions

| Concern | Decision | Rationale |
|---|---|---|
| Trigger | DynamoDB Streams → Lambda event-source mapping | Reuses existing stream (`NEW_AND_OLD_IMAGES`); decoupled (Q5=A). |
| Lambda event types | `DynamoDBStreamEvent`, `DynamoDBRecord`, `DynamoDBBatchResponse` from `aws-lambda` | Already available; matches existing handler style. |
| Stream image parsing | `unmarshall` from `@aws-sdk/util-dynamodb` | **Already installed** (no new dep); converts AttributeValue images to plain objects. |
| Partial failure | `functionResponseType = ReportBatchItemFailures` (return `batchItemFailures`) | Mirrors `sendPushNotification`; per-record retry. |
| Domain reuse | U1 `ChatChannelService`; existing `BloodDonationService`, `AcceptDonationService` | No duplication; create/lock/context/fan-out already exist. |
| Decision logic | new pure `classifyStreamItem` + `ChannelLifecycleService` (chatWorkflow) | AWS-agnostic, unit-testable (PBT). |
| Tests | Jest + **fast-check** (from U1) + aws-sdk-client-mock | PBT classifier/idempotence + example handler tests. |

## New Dependencies
- **None.** All required packages (`aws-lambda` types, `@aws-sdk/util-dynamodb`, `fast-check`,
  `@aws-sdk/client-dynamodb`) are already present.

## PBT-09 Compliance
- Framework already selected (fast-check). U2 adds a domain generator for stream-classification inputs
  (PBT-07) reusing the id/status arbitraries.
