# Application Design (Consolidated) — Issue #571 (In-app Chat)

Consolidates `components.md`, `component-methods.md`, `services.md`, and `component-dependency.md`.

## 1. Design Goals
Deliver the ticket's in-app chat as an **additive** layer on the existing serverless single-table
architecture, following the repo's hexagonal pattern (handler → domain service → port → AWS
adapter), reusing the DynamoDB stream and SQS/SNS push path, and satisfying the enabled **Security**
and **PBT** extensions.

## 2. Component Summary
- **DTOs (commons/dto)**: `ChatChannelDTO`, `ChatMessageDTO`, `ChatConnectionDTO`,
  `ChatChannelStatus`, realtime event types; `NotificationType.CHAT_MESSAGE`.
- **Domain (core/application/chatWorkflow)**: `ChatChannelService`, `ChatMessageService`,
  `ChatConnectionService`; ports `ChatChannelRepository`, `ChatMessageRepository`,
  `ChatConnectionRepository`, `RealtimeNotifier`.
- **Adapters (core/services/aws)**: handlers `chatAuthorizer`, `chatConnect`, `chatDisconnect`,
  `chatSendMessage`, `chatTyping`, `chatMarkRead`, `chatChannelCreator`, `chatGetHistory`;
  `Chat*Model` + `Chat*DynamoDbOperations`; `ApiGatewayManagementApiOperations`.
- **Mobile (clients/mobile)**: `ChatInbox`, `ChatRoom`, `ChatRoomHeader`; `useChatInbox`,
  `useChatRoom`; entry buttons; navigation + push deep-link.
- **Infra (iac/terraform/aws/chat)**: WebSocket API, stream event-source mapping, IAM.

## 3. Key Interfaces
See `component-methods.md`. Highlights:
- `ChatChannelService.createChannelIfAbsent(...)` — idempotent (US-1, PBT-04).
- `ChatMessageService.sendMessage(...)` — participant + open + length + rate-limit checks, persist,
  realtime broadcast, push fallback (US-4, US-10, US-12; SECURITY-05/08/11).
- `RealtimeNotifier.broadcastToChannel(...)` — delivery with stale-connection cleanup (NFR-4).

## 4. Orchestration (see services.md)
1. **Stream**: acceptance row → `chatChannelCreator` → create (ACCEPTED) / lock (COMPLETED).
2. **Send**: WSS `sendMessage` → validate → persist → broadcast → push-if-offline.
3. **Connect/typing/read**: connection registry + ephemeral typing + read receipts.
4. **History**: REST, participant-authorized, newest-first.

## 5. Security Touchpoints (extension — full, blocking)
| Rule | Where enforced |
|---|---|
| SECURITY-01 | DynamoDB at-rest (table already encrypted); WSS/HTTPS in transit |
| SECURITY-02 | WebSocket + REST API Gateway access/execution logging |
| SECURITY-03 | Structured logs, correlation IDs, no PII/body/token in logs |
| SECURITY-05 | Input validation on every route (type, ≤2000, text-only) |
| SECURITY-06 | Least-privilege IAM per chat Lambda (scoped table/queue/connection ARNs) |
| SECURITY-08 | Participant check on connect/send/history; server-side JWT validation; no IDOR |
| SECURITY-11 | Rate limiting (60/min); chat-auth isolated; flood abuse case addressed |
| SECURITY-14 | ≥90-day log retention; alerts on auth/authz failures |
| SECURITY-15 | Fail-closed handling on all external calls; global handler per Lambda |
(SECURITY-04/07/09/10/12/13 evaluated per-stage; web-header rule largely N/A — no new HTML endpoint.)

## 6. PBT Touchpoints (extension — full, blocking; fast-check)
Property targets identified per component in `component-methods.md` (round-trip, invariant,
idempotence, stateful). Carried into Functional Design (PBT-01) and Code Generation.

## 7. Deferred to Functional Design (per unit)
- Exact DynamoDB key schemas for `CHAT_CHANNEL#` / `CHAT_MSG#` / `CHAT_CONN#` and the overloaded
  GSI1 inbox access pattern (list channels per user, recency-sorted) + read-state storage.
- Rate-limit counter mechanism (sliding window) details.
- WebSocket message/event envelope JSON schema and OpenAPI for `getHistory`.
- Offline-queue + reconnect semantics in the mobile hooks.

## 8. Traceability
- Requirements FR-1..FR-9, NFR-1..NFR-7 → components in `components.md` (coverage table).
- Stories US-1..US-14 → components/flows (coverage tables in components.md & services.md).
- Maps cleanly onto the 6 proposed units (U1 Chat Core … U6 Infrastructure) for Units Generation.
