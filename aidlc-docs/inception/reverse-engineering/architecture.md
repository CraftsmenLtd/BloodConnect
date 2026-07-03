# System Architecture

> **Scope note**: Feature-scoped to Issue #571. Areas the chat feature touches are documented in
> depth; the rest of the system is summarized.

## System Overview

BloodConnect is a **serverless, event-driven** application on AWS. A DynamoDB **single-table**
design (`PK`/`SK`, with `LSI1` and `GSI1`) backs the domain. Lambda handlers (TypeScript, bundled
with esbuild) implement HTTP APIs (via API Gateway + CloudFront), SQS consumers, and Step
Functions for donor search. Push notifications go out via SQS → Lambda → SNS (APNs/FCM). Clients
are a React Native/Expo mobile app plus React/Vite web dashboards (organization, monitoring).

## Architecture Diagram (text)

```
  [Mobile App / Web]
        | HTTPS (Cognito-authenticated)
        v
  [CloudFront] -> [API Gateway] -> [Lambda HTTP handlers]
                                        |
            +---------------------------+---------------------------+
            |                           |                           |
            v                           v                           v
   acceptDonationRequest        createBloodDonation         registerUserDevice
   completeDonationRequest       donorSearch (Step Fns)      sendPushNotification (SQS consumer)
            |                           |                           ^
            v                           v                           |
        [DynamoDB single table: PK/SK, LSI1, GSI1]                  |
            |  (streams: NEW_AND_OLD_IMAGES)                        |
            |                                                       |
            +----> [DynamoDB Stream] (currently consumed by:        |
            |        donor-search / notification flows)             |
            |                                                       |
   [Push Notification SQS Queue] --------------------------------->-+
            ^                                                       |
            | sendNotification(...)                                 v
   domain services enqueue                              [SNS Platform Apps: APNs / FCM]
                                                                    |
                                                                    v
                                                           [Device push tokens]
```

## Component Descriptions

### core/application (domain)
- **Purpose**: Business workflows independent of AWS.
- **Responsibilities**: `bloodDonationWorkflow` (AcceptDonationService, BloodDonationService,
  DonorSearchService, DonationRecordService), `notificationWorkflow` (NotificationService),
  `userWorkflow` (UserService), repository interfaces under `models/policies/repositories`.
- **Dependencies**: `commons/dto`, `commons/libs`.
- **Type**: Application (pure logic).

### core/services/aws (adapters)
- **Purpose**: Bind AWS events to domain services; own DynamoDB/SQS/SNS operations.
- **Responsibilities**: Lambda handlers, `commons/ddbOperations/*`, `commons/sqs/SQSOperations`,
  `commons/sns/SNSOperations`, `commons/ddbModels/*`, `commons/logger/*`.
- **Dependencies**: `core/application`, AWS SDK v3.
- **Type**: Application (infrastructure adapter).

### commons/dto and commons/libs
- **Purpose**: Shared DTOs and utilities (config, logger, constants, error handling).
- **Type**: Shared.

### clients/mobile
- **Purpose**: React Native/Expo app for donors and seekers.
- **Type**: Client.

### iac/terraform/aws
- **Purpose**: Production infrastructure modules.
- **Type**: Infrastructure.

## Data Flow — Donor Acceptance (chat trigger point)

Text sequence (the moment chat should be created):

```
Donor taps Accept
  -> POST accept donation  (acceptDonationRequest Lambda)
     -> AcceptDonationService.acceptDonationRequest(status=ACCEPTED)
        -> getAcceptanceRecord(seekerId, requestPostId, donorId)   [null on first accept]
        -> createAcceptanceRecord(...)        [writes ACCEPTED row to DynamoDB]
        -> sendNotificationToSeeker(...)       [REQ_ACCEPTED -> SQS -> push]
        -> updateDonationNotification(...)     [BLOOD_REQ_POST status update]
  -> DynamoDB write triggers Stream (NEW_AND_OLD_IMAGES)   <-- chatChannelCreator hooks here
```

On `COMPLETED` / `IGNORED`, the same acceptance row's status changes (or the row is deleted for
IGNORED) — the chat feature must lock/archive the channel on these transitions.

## Integration Points
- **External APIs**: Maps/geolocation (core/services/maps, core/application/maps).
- **Databases**: DynamoDB single table (PK/SK + LSI1 + GSI1), streams enabled.
- **Third-party Services**: AWS SNS (APNs + FCM) for push; Cognito for auth; SES for email.

## Infrastructure Components
- **IaC**: Terraform modules in `iac/terraform/aws/` (dynamodb, lambda, notification, donation,
  donor_search, cognito, sqs, cloudfront, website, monitoring-site, ...).
- **Deployment Model**: Serverless (Lambda + managed services); LocalStack for local dev
  (`deployment/localstack`).
- **Region**: ap-south-1.

## Key Observation for Issue #571
- DynamoDB streams are **already enabled** (`stream_view_type = "NEW_AND_OLD_IMAGES"`), so a new
  `chatChannelCreator` Lambda can subscribe to acceptance-row changes without schema/table changes.
- There is currently **no WebSocket API Gateway** and **no DynamoDB-stream Lambda consumer file**
  in the repo — both are net-new for this feature.
- The notification path (SQS queue + `send-push-notification` consumer + SNS) is reusable for the
  `CHAT_MESSAGE` push type.
