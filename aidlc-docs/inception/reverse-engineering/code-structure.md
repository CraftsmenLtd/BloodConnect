# Code Structure

> **Scope note**: Feature-scoped to Issue #571. The "Existing Files Inventory" lists the files
> most likely to be **read or modified** by the chat feature, plus the patterns new files should
> follow.

## Build System
- **Type**: npm workspaces (monorepo). Lambda bundling via esbuild (`make build-node-all`);
  web via Vite; mobile via EAS/Expo; IaC via Terraform.
- **Key config**: root `package.json`, `tsconfig.json`, `eslint.config.js`, `jest.config.ts`,
  `Makefile`.

## Architectural Layering (backend)
```
clients (mobile/web)
        | HTTP (Cognito JWT)
        v
core/services/aws/<domain>/<handler>.ts      (Lambda entry: parse event, build services, respond)
        |
        v
core/application/<workflow>/<Service>.ts     (pure domain logic; depends on repository interfaces)
        |
        v
core/application/models/policies/repositories/*Repository.ts   (interfaces)
        ^
        | implemented by
core/services/aws/commons/ddbOperations/*DynamoDbOperations.ts (DynamoDB single-table adapters)
core/services/aws/commons/ddbModels/*Model.ts                  (PK/SK key prefixes + marshalling)
```

This is the canonical pattern new chat code should follow: **handler → service → repository
interface → DynamoDB operations + key model**.

## Existing Files Inventory (chat-relevant)

### Domain (core/application)
- `core/application/bloodDonationWorkflow/AcceptDonationRequestService.ts` — accept/ignore logic;
  emits seeker notifications. **The acceptance transition that should trigger channel creation.**
- `core/application/bloodDonationWorkflow/Types.ts` — `AcceptDonationRequestAttributes`, etc.
- `core/application/notificationWorkflow/NotificationService.ts` — sendNotification (enqueue),
  sendPushNotification (SNS), CRUD for donation notifications.
- `core/application/notificationWorkflow/Types.ts` — `NotificationAttributes`,
  `DonationNotificationAttributes`.
- `core/application/userWorkflow/UserService.ts` — `getUser` (donor/seeker profiles).
- `core/application/models/queue/QueueModel.ts` — queue abstraction used to enqueue notifications.
- `core/application/models/policies/repositories/AcceptDonationRepository.ts` — repo interface.

### Adapters (core/services/aws)
- `core/services/aws/bloodDonation/acceptDonationRequest.ts` — Lambda wiring for accept/ignore.
- `core/services/aws/bloodDonation/completeDonationRequest.ts` — completion (locks chat).
- `core/services/aws/notification/sendPushNotification.ts` — SQS consumer → SNS push.
- `core/services/aws/notification/registerUserDevice.ts` — device-token registration.
- `core/services/aws/commons/ddbOperations/AcceptedDonationDynamoDbOperations.ts` — key patterns.
- `core/services/aws/commons/ddbModels/AcceptDonationModel.ts` — `ACCEPTED_DONATION_PK_PREFIX`,
  `ACCEPTED_DONATION_SK_PREFIX` (key-prefix convention to mirror for chat entities).
- `core/services/aws/commons/sqs/SQSOperations.ts`, `commons/sns/SNSOperations.ts` — reusable.

### Shared contracts (commons/dto)
- `commons/dto/DonationDTO.ts` — `AcceptDonationStatus`, `AcceptDonationDTO`, `DonationDTO`.
- `commons/dto/NotificationDTO.ts` — `NotificationType` enum (extend with `CHAT_MESSAGE`),
  payload types.
- `commons/dto/MessageDTO.ts` — current generic message types (chat may add a `ChatMessageDTO`).
- `commons/dto/UserDTO.ts` — user/profile contract.

### Mobile (clients/mobile/src)
- `myActivity/donorTracking/` — seeker's view of accepted donors (`bloodRequestStatus`,
  `donorConfirmation`). **"Chat" button on accepted donor card goes here.**
- `myActivity/` (donor side) — active donation card location for donor "Chat" button.
- `setup/notification/NotificationProvider.tsx`, `NotificationData.ts`,
  `registerForPushNotifications.ts` — push handling + deep-link entry points.
- `setup/navigation/Navigator.tsx`, `routes.ts`, `navigationTypes.ts` — add `ChatInbox` /
  `ChatRoom` routes here.
- `api/hooks/` — existing hook pattern (`useDonationStatus`, `useFetchCountry`) to mirror for
  `useChatRoom` / `useChatInbox`.

### Infrastructure (iac/terraform/aws)
- `dynamodb/dynamodb.tf` — single table, **streams already enabled** (`NEW_AND_OLD_IMAGES`).
- `lambda/` — reusable Lambda module (`lambda.tf`, `iam.tf`, `policy.tf`, `variables.tf`).
- `notification/lambdas.tf`, `sqs_trigger.tf`, `queues.tf`, `sns.tf` — template for adding chat
  Lambdas, an SQS event-source mapping, and (new) WebSocket integration.

### API specs (openapi)
- `openapi/paths/notification`, `openapi/paths/donations`, `openapi/paths/users` — add a
  `getHistory` path under a new `chat` (or `notification`) grouping.

## Design Patterns
### Hexagonal / Ports-and-Adapters
- **Location**: `core/application` (ports = repository interfaces) vs. `core/services/aws`
  (adapters = DynamoDB/SQS/SNS implementations).
- **Purpose**: Keep domain logic testable and AWS-agnostic.

### Single-Table DynamoDB with key-prefix models
- **Location**: `core/services/aws/commons/ddbModels/*Model.ts`.
- **Implementation**: Each entity defines `*_PK_PREFIX` / `*_SK_PREFIX` constants; operations
  build composite keys. **Acceptance (verified against `AcceptDonationModel.ts` + `Database.rst`)**:
  `ACCEPTED_DONATION_PK_PREFIX = 'BLOOD_REQ'`, so `PK = BLOOD_REQ#<seekerId>`,
  `SK = ACCEPTED#<requestPostId>#<donorId>` — acceptances **co-locate in the request's partition**
  (the constant name `ACCEPTED_DONATION_PK_PREFIX` is misleading; its value is `'BLOOD_REQ'`).
- **As-built schema source of truth**: `docs/architecture/Database.rst` (single table, overloaded
  `GSI1`/`LSI1`, `#` delimiter, ISO-8601 timestamp segments). New chat entities must follow these
  conventions.

### SQS batch consumer with partial-batch failure
- **Location**: `sendPushNotification.ts` (returns `batchItemFailures`, `ReportBatchItemFailures`).

## Critical Dependencies
- **AWS SDK v3** (`@aws-sdk/client-*`) — DynamoDB, SQS, SNS, (new) ApiGatewayManagementApi for
  WebSocket message delivery.
- **aws-sdk-client-mock** — mocking AWS in Jest tests.
- **Expo / React Native** — mobile runtime.
