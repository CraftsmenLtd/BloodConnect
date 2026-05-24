# Code Structure

## Build System
- **Type**: npm workspaces (Node >= 20, ES Modules)
- **Configuration**: Root `package.json` with `workspaces` array
- **Lambda Bundling**: esbuild via `make build-node-all`
- **Mobile**: Expo EAS build
- **Web**: Vite

## Key Modules

### Mobile App (`clients/mobile/src/`)

```
src/
  donationWorkflow/
    createUpdateDonation/     - Create/edit blood request screens
    donationPosts/            - Public posts browsing
    donorResponse/            - Donor accept/reject UI
    donationService.ts        - All donation API calls
    types.ts                  - BloodDonationRecord, screen prop types
  myActivity/
    myPosts/
      details/
        Detail.tsx            - Seeker request detail screen         PostCard.tsx          - Request card component
      donorResponses/
        DonorResponses.tsx    - Accepted donors list
    donorTracking/
      bloodRequestStatus/
        RequestStatusScreen.tsx - Confirm completion screen
      donorConfirmation/
        DonorConfirmationScreen.tsx - Select completing donors
    context/
      MyActivityProvider.tsx  - State: donationPosts, myResponses
    MyActivityTab.tsx         - Tab UI: My Requests | My Responses
    useMyActivity.ts          - Activity state hook
  api/
    hooks/
      useDonationStatus.tsx   - PATCH donation status
  authentication/             - Login/register/confirm flows
  setup/
    navigation/               - React Navigation config
    theme/                    - Design tokens
    notification/             - Push notification handlers
  components/                 - Shared UI components
  LocationService/            - Device GPS, location helpers
  utility/                    - HTTP client, formatters, helpers
```

### AWS Lambda Handlers (`core/services/aws/`)

```
bloodDonation/
  createBloodDonation.ts      - POST /donations handler
  updateBloodDonation.ts      - PATCH /donations handler
  getBloodDonation.ts         - GET /donations/{id}/{createdAt} handler
  listBloodDonations.ts       - GET /donations handler
  getPublicBloodDonationPosts.ts - GET /donations/posts/{geo}
  completeDonation.ts         - POST /donations/complete
  cancelDonation.ts           - PATCH /donations/cancel

donorSearch/
  donationRequestInitiator.ts - DynamoDB stream trigger: creates DonorSearchRecord
  donorSearch.ts              - Main search Lambda: finds+notifies donors

notification/
  notificationService.ts      - SNS/Firebase push notification sender

user/
  handlers                    - Cognito user management

maps/
  handlers                    - Geocoding/location endpoints

commons/
  ddbOperations/
    DonorSearchDynamoDbOperations.ts  - getDonorSearchItem()     BloodDonationDynamoDbOperations.ts
    AcceptDonationDynamoDbOperations.ts
  models/
    DonorSearchModel.ts       - DynamoDB keys for DonorSearch table
```

### Business Logic (`core/application/`)

```
bloodDonationWorkflow/
  BloodDonationService.ts     - createBloodDonation, updateBloodDonation, completeDonation
  DonorSearchService.ts       - initiateDonorSearchRequest, searchDonors   AcceptDonationService.ts    - handleDonorAcceptance
utils/
  geohash.ts                  - Geohash generation and neighbor lookup
  jwt.ts                      - JWT decode utilities
```

### DTOs (`commons/dto/`)

```
DonationDTO.ts
  - DonationDTO              - Main blood request record
  - DonorSearchDTO           - Search status + notifiedEligibleDonors   - DonorSearchStatus        - Enum: PENDING | COMPLETED
  - AcceptDonationDTO        - Donor acceptance record
  - AcceptDonationStatus     - Enum: PENDING | ACCEPTED | COMPLETED | IGNORED
  - EligibleDonorInfo        - {distance, locationId}
  - DonationStatus           - PENDING | MANAGED | COMPLETED | CANCELLED | EXPIRED
  - BloodGroup               - Enum of all blood types
```

## Design Patterns

### Repository Pattern
- **Location**: `core/services/aws/commons/ddbOperations/`
- **Purpose**: Encapsulate DynamoDB access logic
- **Implementation**: Separate classes per entity (BloodDonation, DonorSearch, AcceptDonation)

### Lambda Handler Pattern
- **Location**: `core/services/aws/*/`
- **Purpose**: Each business operation is a separate Lambda function
- **Implementation**: Handler function exports, business logic delegated to `core/application`

### Context/Provider Pattern
- **Location**: `clients/mobile/src/myActivity/context/MyActivityProvider.tsx`
- **Purpose**: Shared state for seeker's activity screen
- **Implementation**: React Context + Provider with fetch functions

### Geohash-based Neighbor Search
- **Location**: `core/application/utils/geohash.ts` + `DonorSearchService.ts`
- **Purpose**: Expand search radius progressively to find nearby donors
- **Implementation**: Start at high precision geohash, expand to neighbors level by level

## Critical Dependencies

### ngeohash
- **Version**: latest
- **Usage**: `core/application/utils/geohash.ts`
- **Purpose**: Encode lat/lng to geohash, find neighbor geohashes

### aws-sdk v3 (@aws-sdk/client-dynamodb, @aws-sdk/lib-dynamodb)
- **Version**: v3
- **Usage**: All Lambda handlers
- **Purpose**: DynamoDB, SNS, SES, EventBridge operations

### Expo / React Native
- **Version**: Expo SDK (see clients/mobile/package.json)
- **Usage**: `clients/mobile`
- **Purpose**: Cross-platform mobile app

### aws-sdk-client-mock
- **Version**: latest dev dep
- **Usage**: All Lambda unit tests
- **Purpose**: Mock AWS SDK calls in Jest tests

## Existing Files Inventory

- `clients/mobile/src/myActivity/myPosts/details/Detail.tsx` - Seeker request detail screen
- `clients/mobile/src/myActivity/context/MyActivityProvider.tsx` - Seeker activity state management
- `clients/mobile/src/donationWorkflow/donationService.ts` - All donation API calls
- `core/services/aws/donorSearch/donorSearch.ts` - Main donor search Lambda
- `core/services/aws/donorSearch/donationRequestInitiator.ts` - Stream trigger Lambda
- `core/services/aws/commons/ddbOperations/DonorSearchDynamoDbOperations.ts` - DonorSearch DB operations
- `core/services/aws/commons/ddbModels/DonorSearchModel.ts` - DonorSearch DynamoDB key definitions
- `commons/dto/DonationDTO.ts` - All donation-related DTOs and enums
- `openapi/paths/donations/donation.json` - Donation API OpenAPI spec
