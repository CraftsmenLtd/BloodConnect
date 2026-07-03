# Application Design Plan — Issue #571 (In-app Chat)

> **Note on answers**: Per the user's standing instruction *"for further questions, add your
> recommendation"*, design questions are pre-filled with recommended choices. Overridable at the
> Application Design review gate. Detailed key schemas/business rules are intentionally deferred to
> per-unit **Functional Design** (this stage defines components, responsibilities, and interfaces).

## Design Decisions (recommended, pre-filled)

### Q-1 — Domain service decomposition
A) One big `ChatService`
B) Split: `ChatChannelService` (lifecycle), `ChatMessageService` (messages/receipts/unread),
   `ChatConnectionService` (WebSocket connections), with a `RealtimeNotifier` port for delivery
X) Other

[Answer]: B — matches the existing one-service-per-concern style in `bloodDonationWorkflow` /
`notificationWorkflow`; keeps lifecycle, messaging, and connection state independently testable.

### Q-2 — WebSocket route style
A) Single `$default` route dispatching on an `action` field
B) Distinct routes: `$connect`, `$disconnect`, `sendMessage`, `typing`, `markRead`
X) Other

[Answer]: B — distinct routes via API Gateway route-selection on `action`; clearer IAM + handler
separation. Typing is ephemeral (no persistence); markRead updates `lastReadAt`.

### Q-3 — Stream consumer responsibility
A) `chatChannelCreator` creates channels only; a separate Lambda handles locking
B) One `chatChannelCreator` stream consumer handles BOTH create (on ACCEPTED) and lock (on COMPLETED)
X) Other

[Answer]: B — single stream consumer keyed off acceptance-row changes; one place for lifecycle.
IGNORED is ignored by the consumer (channel stays OPEN per requirements Q6=C).

### Q-4 — Real-time delivery abstraction
A) Call `ApiGatewayManagementApi` directly from handlers
B) Define a `RealtimeNotifier` port (domain) implemented by an `ApiGatewayManagementApi` adapter
X) Other

[Answer]: B — keeps `core/application` AWS-agnostic and unit-testable (mirrors the `QueueModel` /
`SNSOperations` separation already in the repo).

### Q-5 — Push fallback integration
A) New push pipeline for chat
B) Reuse the existing SQS push queue + `send-push-notification` Lambda + SNS, with new
   `NotificationType.CHAT_MESSAGE`
X) Other

[Answer]: B — reuse existing notification path (requirements FR-8); minimal new infra.

### Q-6 — Data-model depth at this stage
A) Define exact PK/SK/GSI keys now
B) Identify entities + access patterns now; finalize exact keys in Functional Design (U1)
X) Other

[Answer]: B — per the workflow, Application Design is interface-level; key schemas belong to
Functional Design. Entities: `ChatChannelDTO`, `ChatMessageDTO`, `ChatConnectionDTO` (+ inbox
membership/index access pattern), all in the shared single table with `CHAT_*#` prefixes.

## Execution Checklist (artifact generation)
- [x] components.md — components, responsibilities, interfaces
- [x] component-methods.md — high-level method signatures + I/O types
- [x] services.md — service definitions + orchestration flows
- [x] component-dependency.md — dependency matrix + data-flow diagrams
- [x] application-design.md — consolidated design
- [x] Validate completeness vs requirements FR-1..FR-9 and stories US-1..US-14
- [x] Note Security (SECURITY-05/06/08/11/15) + PBT touchpoints for downstream stages
