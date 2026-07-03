# API Documentation

> **Scope note**: Feature-scoped to Issue #571 — documents the existing APIs/contracts the chat
> feature builds on, and identifies the net-new surface.

## Existing REST APIs (chat-relevant)

### Accept / Ignore Donation Request
- **Handler**: `core/services/aws/bloodDonation/acceptDonationRequest.ts`
- **Purpose**: Donor accepts or ignores a request; on `ACCEPTED` creates an acceptance record and
  notifies the seeker.
- **Request (event attributes)**: `{ donorId, seekerId, requestPostId, createdAt, status }`
  where `status ∈ {ACCEPTED, IGNORED}`.
- **Response**: `200` `{ message: "Donation request <status> successfully." }`, else `500`.

### Complete Donation Request
- **Handler**: `core/services/aws/bloodDonation/completeDonationRequest.ts`
- **Purpose**: Marks a donation as completed (`AcceptDonationStatus → COMPLETED`). Chat must lock
  on this transition.

### Register User Device
- **Handler**: `core/services/aws/notification/registerUserDevice.ts`
- **Purpose**: Registers a device push token with an SNS platform endpoint (APNs/FCM).

### Send Push Notification (internal, SQS-triggered)
- **Handler**: `core/services/aws/notification/sendPushNotification.ts`
- **Trigger**: SQS event-source mapping (`batch_size = 10`, `ReportBatchItemFailures`).
- **Purpose**: Consumes queued `NotificationAttributes` and delivers via SNS. Reusable for the
  new `CHAT_MESSAGE` push type.

## Internal APIs (domain services)

### AcceptDonationService (`core/application/bloodDonationWorkflow/AcceptDonationRequestService.ts`)
- `acceptDonationRequest(donorId, seekerId, requestPostId, createdAt, status, bloodDonationService, userService, notificationService, queueModel, notificationQueueUrl)` — main entry.
- `createAcceptanceRecord(donorId, seekerId, createdAt, requestPostId, donorProfile)` — writes the
  `ACCEPTED` row (DynamoDB stream fires here).
- `getAcceptanceRecord(seekerId, requestPostId, donorId)` / `getAcceptedDonorList(seekerId, requestPostId)`.
- `updateAcceptanceRecordStatus(seekerId, requestPostId, donorId, status)`.
- **Exposes** `senderId`/`seekerId`/`donorId`/`requestPostId` — all identifiers needed to scope a
  chat channel (per the ticket).

### NotificationService (`core/application/notificationWorkflow/NotificationService.ts`)
- `sendNotification(notificationAttributes, queueModel, notificationQueueUrl)` — enqueue to SQS.
- `sendPushNotification(...)` — deliver via SNS.
- `createBloodDonationNotification` / `updateBloodDonationNotificationStatus` /
  `getBloodDonationNotification`.

### AcceptedDonationDynamoDbOperations (`core/services/aws/commons/ddbOperations/`)
- `getAcceptedRequest(seekerId, requestPostId, donorId)`
- `queryAcceptedRequests(seekerId, requestPostId)` — `begins_with(SK, ACCEPTED#<requestPostId>)`.
- `deleteAcceptedRequest(seekerId, requestPostId, donorId)`

## Data Models (existing)

### AcceptDonationDTO (`commons/dto/DonationDTO.ts`)
- **Fields**: `donorId`, `requestPostId`, `seekerId`, `status: AcceptDonationStatus`,
  `acceptanceTime?`, `createdAt`.
- **Key pattern** (verified): `PK = BLOOD_REQ#<seekerId>`, `SK = ACCEPTED#<requestPostId>#<donorId>`
  (`ACCEPTED_DONATION_PK_PREFIX = 'BLOOD_REQ'`). Acceptances co-locate in the request's partition.

### NotificationDTO / NotificationType (`commons/dto/NotificationDTO.ts`)
- **NotificationType**: `BLOOD_REQ_POST | REQ_ACCEPTED | REQ_IGNORED | COMMON`
  (→ extend with `CHAT_MESSAGE`).
- **Payloads**: `DonationRequestPayload`, `DonationAcceptancePayload`.

## Net-New API Surface for Issue #571 (to be designed)
- **WebSocket API** (API Gateway v2): `$connect` (chatConnect), `$disconnect` (chatDisconnect),
  `sendMessage` (chatSendMessage) routes — **does not exist yet**.
- **REST**: `GET` chat history (`chatGetHistory`) — paginated, newest-first, scoped to
  `(requestPostId, seekerId, donorId)`. To be added under `openapi/paths/`.
- **Stream consumer**: `chatChannelCreator` Lambda on the DynamoDB stream — **no stream-consumer
  Lambda exists today**; this is net-new wiring.
- **New DTOs**: `ChatChannelDTO` (status `OPEN | LOCKED`), `ChatMessageDTO`, plus a
  WebSocket-connection record DTO.
