# Component Inventory

## Application Packages
- `core/application` - Business logic: BloodDonationService, DonorSearchService, AcceptDonationService, geohash utils
- `core/services/aws` - Lambda handlers for all API endpoints and async processing
- `core/services/maps` - Maps/geocoding integration
- `clients/mobile` - React Native / Expo mobile app (iOS + Android)
- `clients/organization` - React/Vite org dashboard web app
- `clients/monitoring` - React/Vite monitoring dashboard web app

## Infrastructure Packages
- `deployment/aws` - Terraform - AWS production infrastructure (Lambda, DynamoDB, Cognito, SNS, SES, SQS, EventBridge, API Gateway, S3)
- `deployment/localstack` - Terraform - LocalStack local dev environment
- `iac/terraform` - Additional IaC configurations

## Shared Packages
- `commons/dto` - Shared DTOs and enums (DonationDTO, DonorSearchDTO, AcceptDonationDTO, BloodGroup, DonationStatus)
- `commons/libs` - Shared utilities (config, logger, error handling)

## Test Packages
- Jest unit tests co-located with source in each package
- Coverage threshold: 60% functions globally

## Total Count
- **Total Packages**: 9
- **Application**: 6 (core/application, core/services/aws, core/services/maps, mobile, org, monitoring)
- **Infrastructure**: 3 (deployment/aws, deployment/localstack, iac/terraform)
- **Shared**: 2 (commons/dto, commons/libs)
- **Test**: Unit tests co-located
