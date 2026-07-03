# Business Overview

> **Scope note**: This reverse-engineering pass is **feature-scoped** to the blast radius of
> Issue #571 (in-app chat). It documents the whole system at a high level but goes deep only on
> the donation-acceptance, notification, data-store, and mobile-activity areas the chat feature
> integrates with.

## Business Context

BloodConnect (https://bloodconnect.net) is a blood donation management platform that connects
**seekers** (people who need blood), **donors**, blood banks, and organizations for emergency
blood requests. It replaces manual phone-based donor search with geolocation-prioritized
automated matching.

### Business Context Diagram (text)

```
        +------------------+        creates request         +------------------+
        |     Seeker       | -----------------------------> |   BloodConnect   |
        | (needs blood)    |                                |    Platform      |
        +------------------+ <----- "Donor Found" push ---- +------------------+
                 ^                                                   |
                 |                                                   | geo-prioritized
                 | phone/SMS (today)                                 | donor search
                 |                                                   v
        +------------------+        accept / ignore         +------------------+
        |     Donor        | <----------------------------- |  Eligible Donors |
        | (gives blood)    | -----------------------------> |   (notified)     |
        +------------------+                                +------------------+
```

## Business Description

- **Business Description**: A serverless platform where a seeker posts a blood request; the
  system finds and notifies geographically-eligible donors in expanding waves; donors accept or
  ignore; on acceptance the seeker is notified and the two parties coordinate the donation.
- **Business Transactions**:
  - **Create Blood Request** — seeker posts a request (blood group, quantity, urgency, location,
    donation date/time).
  - **Donor Search** — system finds eligible donors using H3 geospatial indexing and notifies
    them in waves (Step Functions / wave history).
  - **Notify Eligible Donors** — push notification (`BLOOD_REQ_POST`) to candidate donors.
  - **Accept Donation Request** — donor accepts (`AcceptDonationStatus → ACCEPTED`); an
    acceptance record is created; seeker gets a `REQ_ACCEPTED` ("Donor Found") notification.
  - **Ignore Donation Request** — donor ignores (`AcceptDonationStatus → IGNORED`); acceptance
    record removed; seeker gets a `REQ_IGNORED` notification.
  - **Complete Donation** — donation is recorded as completed (`COMPLETED`).
  - **Register Device / Send Push Notification** — device tokens registered with SNS; outbound
    notifications dispatched via an SQS queue → `send-push-notification` Lambda → SNS (APNs/FCM).
- **Business Dictionary**:
  - **Seeker** — user who creates a blood request (`seekerId`).
  - **Donor** — user who can fulfill a request (`donorId`).
  - **Request Post** — a single blood request (`requestPostId`, partitioned under the seeker).
  - **Acceptance Record** — the `(seekerId, requestPostId, donorId)` triple recording a donor's
    response and status.
  - **AcceptDonationStatus** — `PENDING | ACCEPTED | COMPLETED | IGNORED`.
  - **Notification** — a stored + pushed message; typed by `NotificationType`.

## Component-Level Business Descriptions

### core/application (business logic)
- **Purpose**: Pure, framework-agnostic domain logic (workflows, services, repository interfaces).
- **Responsibilities**: Donation lifecycle (`bloodDonationWorkflow`), notifications
  (`notificationWorkflow`), users (`userWorkflow`), donor search (H3), maps.

### core/services/aws (Lambda handlers)
- **Purpose**: AWS-specific adapters that wire HTTP/SQS/stream events to the domain services.
- **Responsibilities**: `bloodDonation` (accept/complete/create/cancel/update/get),
  `notification` (registerUserDevice, sendPushNotification), `donorSearch`, `donation`, `maps`,
  DynamoDB single-table operations, SQS/SNS operations.

### commons/dto
- **Purpose**: Shared data contracts across backend and clients.
- **Responsibilities**: `DonationDTO` (incl. `AcceptDonationStatus`, `AcceptDonationDTO`),
  `NotificationDTO` (incl. `NotificationType`, payloads), `UserDTO`, `MessageDTO`.

### clients/mobile (React Native + Expo)
- **Purpose**: Donor/seeker mobile app.
- **Responsibilities**: `myActivity` (donorTracking, myPosts, donorProfile), push-notification
  handling/deep-linking (`setup/notification`), navigation, API hooks.

### iac/terraform/aws (Infrastructure as Code)
- **Purpose**: Production AWS infrastructure.
- **Responsibilities**: DynamoDB single table (streams enabled), Lambda module, SQS queues +
  event-source mappings, SNS platform applications, Cognito, API Gateway, CloudFront.
