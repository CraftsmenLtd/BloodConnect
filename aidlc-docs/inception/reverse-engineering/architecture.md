# System Architecture

## System Overview
BloodConnect is a serverless monorepo application on AWS. Seekers create blood requests via mobile app; AWS Lambda + DynamoDB Streams trigger async donor search via EventBridge Scheduler; donors get push notifications and respond; seekers confirm completion.

## Architecture Diagram

```
+-----------------------------------------------------------+
|                    CLIENT LAYER                           |
|  +------------------+  +-------------+  +-------------+  |
|  |  Mobile App      |  |  Org        |  | Monitoring  |  |
|  |  React Native    |  |  Dashboard  |  | Dashboard   |  |
|  |  Expo (iOS/And)  |  |  React/Vite |  | React/Vite  |  |
|  +--------+---------+  +------+------+  +------+------+  |
+-----------|------------------|-----------------|-----------+
            |                  |                 |
            v                  v                 v
+-----------------------------------------------------------+
|                    AWS API GATEWAY                        |
|              (REST API + Cognito Auth)                    |
+-----------------------------------------------------------+
            |
            v
+-----------------------------------------------------------+
|                  LAMBDA HANDLERS (core/services/aws)      |
|  +---------------+  +--------------+  +--------------+   |
|  | bloodDonation |  | donorSearch  |  | notification |   |
|  | handlers      |  | handlers     |  | handlers     |   |
|  +-------+-------+  +------+-------+  +------+-------+   |
|          |                 |                 |            |
|  +-------v---------+       |          +------v-------+   |
|  | user handlers   |       |          | maps service |   |
|  | (Cognito/profile)|      |          | (geocoding)  |   |
|  +-----------------+       |          +--------------+   |
+---------------------------|-------------------------------+
                            |
            +---------------+---------------+
            v                               v
+---------------------+         +---------------------+
|   DYNAMODB TABLES   |         |  EVENTBRIDGE        |
|  - BloodDonation    |         |  SCHEDULER          |
|  - DonorSearch      |<--------|  (async donor       |
|  - AcceptDonation   |  Stream |   search loop)      |
|  - UserProfile      |  Trigger+---------------------+
+---------------------+
            |
            v
+---------------------+         +---------------------+
|  DynamoDB Streams   |-------->|  donationRequest    |
|  (INSERT/MODIFY)    |         |  Initiator Lambda   |
+---------------------+         +---------------------+

Supporting Services:
- AWS Cognito (auth)
- AWS SES (email)
- AWS SNS (push notifications - Firebase)
- AWS SQS (async processing)
- AWS S3 (assets)
- AWS Step Functions (workflows)
```

## Component Descriptions

### clients/mobile
- **Purpose**: Primary interface for donors and seekers
- **Responsibilities**: Create requests, respond to notifications, track activity
- **Dependencies**: AWS Cognito (auth), REST API (via Axios), Firebase (push)
- **Type**: Client

### clients/organization
- **Purpose**: Web dashboard for blood banks/orgs
- **Responsibilities**: Monitor and coordinate donations
- **Dependencies**: AWS Amplify UI, Redux, TailwindCSS
- **Type**: Client

### clients/monitoring
- **Purpose**: Admin monitoring dashboard
- **Responsibilities**: System health and analytics
- **Dependencies**: React/Vite, AWS Amplify
- **Type**: Client

### core/application
- **Purpose**: Pure business logic layer
- **Responsibilities**: DonorSearchService, BloodDonationService, geohash utils, JWT utils
- **Dependencies**: date-fns, ngeohash
- **Type**: Application

### core/services/aws
- **Purpose**: AWS Lambda handlers
- **Responsibilities**: HTTP request handling, stream processing, scheduling
- **Dependencies**: core/application, commons/dto, AWS SDK v3
- **Type**: Application

### core/services/maps
- **Purpose**: Maps/geolocation integration
- **Responsibilities**: Geocoding, distance calculation
- **Dependencies**: External maps API
- **Type**: Application

### commons/dto
- **Purpose**: Shared type definitions
- **Responsibilities**: DTOs, enums, type contracts
- **Dependencies**: None
- **Type**: Shared

### deployment/aws
- **Purpose**: AWS production infrastructure
- **Responsibilities**: Terraform configs for all AWS resources
- **Type**: Infrastructure

### deployment/localstack
- **Purpose**: Local dev environment
- **Responsibilities**: LocalStack Terraform, local AWS emulation
- **Type**: Infrastructure

## Data Flow

```
Seeker Creates Request:
1. Mobile → POST /donations → bloodDonation Lambda → DynamoDB BloodDonation INSERT
2. DynamoDB Stream → donationRequestInitiator Lambda → Creates DonorSearchRecord (PENDING)
3. donationRequestInitiator → EventBridge Scheduler → donorSearch Lambda (scheduled)
4. donorSearch Lambda → Query donors by geohash → Send SNS notifications → Update notifiedEligibleDonors
5. Repeat step 4 expanding geohash radius until donors found or max level reached
6. Final: DonorSearchRecord.status → COMPLETED

Donor Accepts:
1. Donor gets push notification → Opens mobile app → Taps Accept
2. Mobile → PATCH /donations → AcceptDonation record created (ACCEPTED)
3. Seeker gets push notification: "Donor accepted"

Seeker Completes:
1. Seeker → Detail screen → "Complete Request" → RequestStatusScreen
2. Mobile → POST /donations/complete → BloodDonation status → COMPLETED
3. AcceptDonation records updated, donor lastDonationDate updated
```

## Integration Points

- **External APIs**: Maps provider (geocoding)
- **Databases**: DynamoDB (BloodDonation, DonorSearch, AcceptDonation, UserProfile tables)
- **Third-party Services**: Firebase (push notifications), AWS SNS, AWS SES, AWS Cognito

## Infrastructure Components

- **Terraform Stacks**: AWS Lambda, DynamoDB, API Gateway, Cognito, SNS, SES, SQS, EventBridge, Step Functions, S3
- **Deployment Model**: Serverless (all Lambda), esbuild bundled
- **Region**: ap-south-1
