# Technology Stack

## Programming Languages
- TypeScript (strict) - v5.x - Backend Lambda, mobile app, web clients, DTOs
- Python 3 - Docs (Sphinx), scripts
- Java 17 - Android native (if applicable)

## Frameworks
- React Native + Expo - Mobile app (iOS/Android cross-platform)
- React + Vite - Web clients (org dashboard, monitoring dashboard)
- Redux - State management in web clients
- TailwindCSS - Styling in web clients
- AWS Amplify UI - Auth components in monitoring dashboard

## Infrastructure
- AWS Lambda - All backend compute (serverless)
- AWS DynamoDB - Primary database (BloodDonation, DonorSearch, AcceptDonation, UserProfile tables)
- AWS API Gateway - REST API routing
- AWS Cognito - Authentication and authorization
- AWS SNS - Push notifications (via Firebase FCM)
- AWS SES - Email notifications
- AWS SQS - Async message queuing
- AWS EventBridge Scheduler - Scheduled Lambda invocations (donor search loop)
- AWS Step Functions - Complex workflow orchestration
- AWS S3 - Static assets and file storage
- LocalStack - Local AWS emulation for development

## Build Tools
- esbuild - Lambda function bundling
- Vite - Web client bundling
- EAS (Expo Application Services) - Mobile app build and distribution
- Terraform - Infrastructure as Code
- Make - Build orchestration (Makefile targets)
- npm workspaces - Monorepo dependency management

## Testing Tools
- Jest - Unit test framework (all TypeScript packages)
- ts-jest - TypeScript Jest transformer
- aws-sdk-client-mock - AWS SDK mocking in Lambda tests
- Coverage threshold: 60% functions

## API Tools
- OpenAPI 3.x - API specification
- Spectral - OpenAPI linting
- Redocly - OpenAPI bundling and documentation

## Dev Environment
- Docker + LocalStack - Local AWS emulation
- .devcontainer - Dev container configuration
- Node.js >= 20 - Runtime requirement
