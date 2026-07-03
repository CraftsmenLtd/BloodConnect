# Units of Work — Issue #571 (In-app Chat)

> Units are **logical work packages** within the existing monorepo (not new microservices). Each
> unit goes through the per-unit CONSTRUCTION stages (Functional Design → NFR Requirements → NFR
> Design → Infrastructure Design → Code Generation) before Build & Test.

## U1 — Chat Core (data + domain foundation)
- **Responsibility**: Shared contracts and AWS-agnostic domain + persistence for chat.
- **Scope**:
  - DTOs: `ChatChannelDTO`, `ChatMessageDTO`, `ChatConnectionDTO`, `ChatChannelStatus`, realtime
    event types; add `NotificationType.CHAT_MESSAGE`.
  - Domain services: `ChatChannelService`, `ChatMessageService`, `ChatConnectionService`.
  - Ports: `ChatChannelRepository`, `ChatMessageRepository`, `ChatConnectionRepository`,
    `RealtimeNotifier`.
  - DynamoDB key models + operations: `Chat{Channel,Message,Connection}Model` +
    `Chat{Channel,Message,Connection}DynamoDbOperations` (final key/GSI schema designed here).
- **Deliverables**: compiled domain + repos with unit + PBT tests (round-trip, invariant).
- **Why first**: every other unit depends on these contracts.

## U2 — Channel Lifecycle (stream consumer)
- **Responsibility**: Create channels on acceptance; lock on completion.
- **Scope**: `chatChannelCreator` DynamoDB-stream Lambda; idempotent `createChannelIfAbsent`
  (ACCEPTED), `lockChannel` (COMPLETED); IGNORED no-op; partial-batch-failure handling.
- **Deliverables**: handler + tests (idempotence PBT, stateful OPEN→LOCKED PBT, example-based).
- **Depends on**: U1.

## U3 — Real-time Messaging (WebSocket)
- **Responsibility**: Connections + live messaging + typing/receipts + rate limit + authz.
- **Scope**: `chatAuthorizer`, `chatConnect`, `chatDisconnect`, `chatSendMessage`, `chatTyping`,
  `chatMarkRead`; `ApiGatewayManagementApiOperations` (RealtimeNotifier); rate-limit mechanism;
  participant authorization (SECURITY-08).
- **Deliverables**: handlers + adapter + tests (validation, authz 403, rate-limit, stateful unread).
- **Depends on**: U1.

## U4 — History + Push Fallback
- **Responsibility**: Paginated history API + offline push.
- **Scope**: `chatGetHistory` REST handler + OpenAPI `getHistory` path; `CHAT_MESSAGE` push via the
  existing SQS→`send-push-notification`→SNS path; deep-link payload.
- **Deliverables**: handler + OpenAPI + push wiring + tests (newest-first invariant, authz).
- **Depends on**: U1, U3 (offline-detection + send flow).

## U5 — Mobile Client
- **Responsibility**: All donor/seeker chat UX.
- **Scope**: `ChatInbox`, `ChatRoom`, `ChatRoomHeader`; `useChatInbox`, `useChatRoom` (WebSocket
  connect/send/receive, typing, receipts, unread badge, **offline queue** with `clientMessageId`);
  "Chat" entry buttons (seeker `donorTracking`, donor `myActivity`); navigation routes;
  `CHAT_MESSAGE` deep-link handling.
- **Deliverables**: screens/hooks + tests (`useChatRoom`/`useChatInbox`, offline-queue idempotence).
- **Depends on**: U3 (WebSocket contract), U4 (history + push contracts).

## U6 — Infrastructure & Integration
- **Responsibility**: Consolidated infra + end-to-end wiring.
- **Scope**: `iac/terraform/aws/chat` (WebSocket API + routes + authorizer, stream event-source
  mapping, least-privilege IAM, log groups/retention, alarms); LocalStack parity
  (`deployment/localstack`); env wiring (Config); end-to-end validation.
- **Deliverables**: Terraform (AWS + LocalStack), IAM (SECURITY-06), logging/alerting
  (SECURITY-02/14), integration test scaffolding.
- **Depends on**: U2, U3, U4 (resources they declare); finalized before Build & Test.

## Cross-cutting obligations carried by every unit
- **Security extension (full)**: each unit's NFR/Infra/Code stages enforce the applicable
  SECURITY-* rules and report compliance.
- **PBT extension (full, fast-check)**: each unit identifies properties in Functional Design
  (PBT-01) and implements PBT + example-based tests in Code Generation.
- **Repo rules**: TS strict (no `any`), single quotes/no semicolons/150-col, ≥60% function coverage.
