# API Documentation

## REST APIs (Existing)

### GET /donations/{requestPostId}/{createdAt}
- **Method**: GET
- **Path**: `/donations/{requestPostId}/{createdAt}`
- **Purpose**: Get single blood donation request details
- **Auth**: Cognito JWT required
- **Request**: Path params: `requestPostId`, `createdAt`
- **Response**: `DonationDTO` + `acceptedDonors[]`

### GET /donations
- **Method**: GET
- **Path**: `/donations`
- **Purpose**: List seeker's blood donation requests
- **Auth**: Cognito JWT required
- **Request**: Query params for pagination/filtering
- **Response**: Array of `DonationDTO`

### POST /donations
- **Method**: POST
- **Path**: `/donations`
- **Purpose**: Create blood donation request
- **Auth**: Cognito JWT required
- **Request**: Blood group, quantity, urgency, location, date/time, contact
- **Response**: Created `DonationDTO`

### PATCH /donations
- **Method**: PATCH
- **Path**: `/donations`
- **Purpose**: Update blood donation request
- **Auth**: Cognito JWT required
- **Request**: Partial `DonationDTO` fields
- **Response**: Updated `DonationDTO`

### POST /donations/complete
- **Method**: POST
- **Path**: `/donations/complete`
- **Purpose**: Mark donation request as completed
- **Auth**: Cognito JWT required
- **Request**: `requestPostId`, `createdAt`, `donorIds[]`
- **Response**: Completion confirmation

### PATCH /donations/cancel
- **Method**: PATCH
- **Path**: `/donations/cancel`
- **Purpose**: Cancel active donation request
- **Auth**: Cognito JWT required
- **Request**: `requestPostId`, `createdAt`
- **Response**: Cancelled `DonationDTO`

### GET /donations/posts/{geoPartition}
- **Method**: GET
- **Path**: `/donations/posts/{geoPartition}`
- **Purpose**: Browse public donation requests by location
- **Auth**: Cognito JWT required
- **Request**: Path param: `geoPartition` (geohash prefix)
- **Response**: Array of public `DonationDTO`

### GET /donations/responses
- **Method**: GET
- **Path**: `/donations/responses`
- **Purpose**: Get donor's accepted donation responses
- **Auth**: Cognito JWT required
- **Request**: Query params for pagination
- **Response**: Array of `AcceptDonationDTO`

---

## Data Models

### DonationDTO
- **Fields**: requestPostId, seekerId, requestedBloodGroup, bloodQuantity, urgencyLevel, countryCode, location, latitude, longitude, geohash, donationDateTime, status, contactNumber, patientName, seekerName, transportationInfo, shortDescription, createdAt
- **Relationships**: Has many AcceptDonationDTO, Has one DonorSearchDTO
- **Validation**: Required: requestedBloodGroup, bloodQuantity, location, donationDateTime, contactNumber

### DonorSearchDTO
- **Fields**: seekerId, requestPostId, createdAt, status (PENDING/COMPLETED), notifiedEligibleDonors
- **Relationships**: Belongs to DonationDTO (1:1)
- **Validation**: status must be DonorSearchStatus enum

### AcceptDonationDTO
- **Fields**: donorId, requestPostId, seekerId, createdAt, status (PENDING/ACCEPTED/COMPLETED/IGNORED), acceptanceTime
- **Relationships**: Belongs to DonationDTO
- **Validation**: status must be AcceptDonationStatus enum
