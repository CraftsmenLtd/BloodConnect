# Technology Stack

> **Scope note**: Feature-scoped to Issue #571 — emphasizes the stack elements the chat feature
> uses. Derived from CLAUDE.md plus inspection of code/config.

## Programming Languages
- **TypeScript (strict)** — backend Lambdas, domain logic, web clients, mobile app.
- **Python 3** — supporting scripts/tooling.
- **Java 17** — Android native portions of the mobile build.

## Runtime
- **Node.js >= 20** — Lambda runtime and tooling.

## Backend / AWS
- **AWS Lambda** — handlers (HTTP, SQS consumers, Step Functions tasks).
- **DynamoDB** — single-table design (PK/SK + LSI1 + GSI1); **streams enabled**
  (`NEW_AND_OLD_IMAGES`).
- **SQS** — push-notification queue; event-source mappings (`batch_size = 10`,
  `ReportBatchItemFailures`).
- **SNS** — platform applications for APNs (iOS) and FCM (Android) push delivery.
- **Cognito** — authentication / JWT.
- **SES** — transactional email.
- **Step Functions** — donor search wave orchestration.
- **API Gateway + CloudFront** — REST API edge + CDN.
- **(Net-new for #571)** API Gateway **WebSocket** + `@aws-sdk/client-apigatewaymanagementapi`
  for real-time message delivery.

## Frontend
- **React Native / Expo** — mobile (iOS/Android), EAS build.
- **React / Vite + Redux + TailwindCSS** — organization dashboard.
- **React / Vite + AWS Amplify UI** — monitoring dashboard.

## Infrastructure as Code
- **Terraform** — AWS production (`iac/terraform/aws`, `deployment/aws`) and LocalStack local dev
  (`deployment/localstack`).

## Build Tools
- **esbuild** — Lambda bundling (`make build-node-all`).
- **Vite** — web client builds.
- **EAS / Expo** — mobile builds.
- **npm workspaces** — monorepo dependency/build management.

## Testing Tools
- **Jest + ts-jest** — unit tests; coverage threshold **60% functions** globally.
- **aws-sdk-client-mock** — mocks AWS SDK v3 clients in tests.

## API Tooling
- **OpenAPI 3.x** — API specs.
- **Spectral** — OpenAPI linting.
- **Redocly** — OpenAPI bundling.

## Code Quality Rules (enforced)
- No `any` types (ESLint error).
- Single quotes, no semicolons, 150-char line limit, arrow functions required.

## Dev Environment
- Docker + LocalStack for local AWS emulation; AWS region **ap-south-1**.
