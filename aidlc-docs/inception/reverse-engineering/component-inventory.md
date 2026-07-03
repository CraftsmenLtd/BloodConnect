# Component Inventory

> **Scope note**: Feature-scoped to Issue #571. Counts reflect the workspaces/modules relevant to
> the chat feature, not an exhaustive crawl of every file in the monorepo.

## Application Packages (npm workspaces)
- `core/application` — Pure domain workflows (bloodDonation, notification, user, donorSearch, maps).
- `core/services/aws` — Lambda handlers + AWS adapters (DynamoDB/SQS/SNS operations, ddbModels).
- `core/services/maps` — Maps/geolocation integration.
- `clients/mobile` — React Native/Expo donor & seeker app.
- `clients/organization` — React/Vite org dashboard.
- `clients/monitoring` — React/Vite admin/monitoring dashboard.

## Shared Packages
- `commons/dto` — DTOs: DonationDTO, NotificationDTO, UserDTO, MessageDTO, DTOCommon.
- `commons/libs` — config, logger, constants, error handling.

## Infrastructure Packages
- `iac/terraform/aws` — Production Terraform modules:
  dynamodb, lambda, notification, donation, donor_search, cognito, sqs, eventbridge, sns (via
  notification), cloudfront, website, web-client, monitoring-site, dashboard, maps, user, logger,
  ses-support-email, domain_verification, environments.
- `deployment/aws` — AWS deployment Terraform.
- `deployment/localstack` — LocalStack Terraform for local dev.

## API / Spec Packages
- `openapi/` — OpenAPI 3.x specs + Swagger UI; `openapi/paths/{donations,donors,notification,users,maps,logger,country-availability}`.

## Test Packages
- `core/services/aws/tests`, `core/application/tests` — Jest unit tests (aws-sdk-client-mock).
- `clients/mobile/__tests__` — mobile tests.

## Components Touched / Added by Issue #571

### Modified (existing)
- `commons/dto/NotificationDTO.ts` — add `CHAT_MESSAGE` to `NotificationType`.
- `core/application/bloodDonationWorkflow/AcceptDonationRequestService.ts` — acceptance/completion
  transitions are the channel create/lock triggers (via stream, not direct call).
- `iac/terraform/aws/dynamodb` — reuse existing stream (no schema change expected).
- `clients/mobile/src/myActivity/*` — add "Chat" buttons (seeker donorTracking + donor card).
- `clients/mobile/src/setup/notification/*` + `setup/navigation/*` — deep-link to `ChatRoom`.
- `openapi/paths/*` — add `getHistory` endpoint.

### Net-new
- WebSocket API Gateway (Terraform) + `chatConnect` / `chatDisconnect` / `chatSendMessage` Lambdas.
- `chatChannelCreator` Lambda (DynamoDB stream consumer).
- `chatGetHistory` Lambda (REST).
- DTOs: `ChatChannelDTO`, `ChatMessageDTO`, connection record.
- New domain workflow `core/application/chatWorkflow/*` (service + repository interface).
- New DynamoDB key models + operations for chat channels/messages/connections.
- Mobile `ChatInbox`, `ChatRoom`, `ChatRoomHeader` screens + `useChatRoom` / `useChatInbox` hooks.

## Total Count (relevant scope)
- **Application workspaces**: 6
- **Shared workspaces**: 2
- **Infrastructure modules (aws)**: ~19
- **Net-new backend Lambdas for #571**: 5 (chatConnect, chatDisconnect, chatSendMessage,
  chatChannelCreator, chatGetHistory)
