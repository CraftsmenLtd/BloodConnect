# Business Overview

## Business Context Diagram

```
+------------------+     blood request      +-------------------+
|     SEEKER       |----------------------->|   BloodConnect    |
| (patient/family) |                        |     Platform      |
+------------------+     search donors      +-------------------+
                                                    |
                         notify nearby donors       |
                                                    v
+------------------+     accept/reject      +-------------------+
|     DONOR        |<-----------------------|  Donor Search     |
| (blood donator)  |                        |   Engine          |
+------------------+                        +-------------------+
                                                    |
                                                    v
+------------------+     coordinate         +-------------------+
|  BLOOD BANK /    |<-----------------------|  Organization     |
|  ORGANIZATION    |                        |  Dashboard        |
+------------------+                        +-------------------+
```

## Business Description

- **Business Description**: BloodConnect is a blood donation management platform that replaces manual phone-based donor search with automated geolocation-prioritized matching. It connects seekers (patients/families needing blood) with eligible donors and blood banks in real-time.

- **Business Transactions**:
  1. **Blood Request Creation** - Seeker submits blood request with blood group, quantity, urgency, location
  2. **Donor Search** - System automatically finds nearby eligible donors by expanding geohash radius
  3. **Donor Notification** - System sends push notifications to eligible donors
  4. **Donor Response** - Donor accepts or ignores blood request
  5. **Request Completion** - Seeker confirms blood was received and selects completing donors
  6. **Request Cancellation** - Seeker cancels an active blood request
  7. **Donor Registration** - Donor registers with blood group, location, availability
  8. **Organization Coordination** - Blood bank/org coordinates donors and requests

- **Business Dictionary**:
  - **Seeker**: Person (patient or family) who needs blood
  - **Donor**: Registered blood donor
  - **Request Post**: A blood donation request created by a seeker
  - **Blood Group**: ABO+Rh blood type (A+, A-, B+, B-, O+, O-, AB+, AB-)
  - **Urgency Level**: `regular` or `urgent` - affects how many donors are targeted
  - **Geohash**: Geospatial encoding used to find nearby donors efficiently
  - **Donor Search Status**: PENDING (actively searching) or COMPLETED (search finished)
  - **Donation Status**: PENDING → MANAGED → COMPLETED | CANCELLED | EXPIRED
  - **Notified Eligible Donors**: Map of all donors who received a notification for a request
  - **Search Radius**: Geographic area expanded progressively to find more donors

## Component Level Business Descriptions

### core/application
- **Purpose**: Core business logic for donation workflow, donor matching, and geohashing
- **Responsibilities**: Business rules, geohash calculations, donor eligibility, date/time utilities

### core/services/aws
- **Purpose**: AWS Lambda handlers implementing business transactions as serverless functions
- **Responsibilities**: Handle HTTP requests, process DynamoDB streams, coordinate async workflows

### core/services/maps
- **Purpose**: Geocoding and location-based services
- **Responsibilities**: Convert addresses to coordinates, calculate distances

### clients/mobile
- **Purpose**: React Native mobile app for donors and seekers (iOS/Android)
- **Responsibilities**: Blood request creation, donor response, activity tracking, notifications

### clients/organization
- **Purpose**: Web dashboard for blood banks and organizations
- **Responsibilities**: Coordinate donations, manage donors, view analytics

### clients/monitoring
- **Purpose**: Admin/monitoring web dashboard
- **Responsibilities**: System health, metrics, audit trails

### commons/dto
- **Purpose**: Shared data transfer objects across all packages
- **Responsibilities**: Type safety, API contracts, data shape definitions

### deployment/aws + deployment/localstack
- **Purpose**: Infrastructure as Code for AWS production and local dev
- **Responsibilities**: Terraform configs for DynamoDB, Lambda, Cognito, SES, SNS, SQS, Step Functions
