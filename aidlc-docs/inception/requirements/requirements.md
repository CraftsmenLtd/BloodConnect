# Requirements — Issue #571: In-app Chat among Donor and Seeker

## Intent Analysis Summary
- **User Request**: Implement Issue #571 — an in-app chat channel auto-created when a donor's
  `AcceptDonationStatus` transitions to `ACCEPTED`, scoped to `(seekerId, requestPostId, donorId)`,
  with real-time messaging, history, push fallback, and a locked/archived state on completion.
- **Request Type**: New Feature (large, cross-cutting).
- **Scope Estimate**: Multiple components — backend Lambdas, DynamoDB single-table, new WebSocket
  API (Terraform), mobile client (React Native/Expo), OpenAPI.
- **Complexity Estimate**: Complex (real-time transport, new infra, new domain workflow, stateful).
- **Depth**: Comprehensive.
- **Source ticket snapshot**: `issue-571.md` (repo root).

## Decisions from Requirements Verification (Q&A)
| # | Topic | Decision |
|---|---|---|
| Q1 | Delivery scope | **A — Full feature in one go** (all backend + mobile + NFR acceptance criteria) |
| Q2 | Real-time transport | **A — API Gateway WebSocket API** (as specified) |
| Q3 | Message content | **B — Text + emoji** (Unicode text; no attachments this iteration) |
| Q4 | Phone-number exposure | **B — Keep phone number in notification for now**; chat is additive; removal is a later ticket |
| Q5 | Channel creation | **A — DynamoDB stream consumer** (`chatChannelCreator`) |
| Q6 | Lifecycle on COMPLETED/IGNORED | **C — Lock on COMPLETED only**; IGNORED channels stay open until TTL purge |
| Q7 | Retention & rate limiting | **A — Both**: 90-day TTL + 60 msg/min/channel rate limiting |
| Q8 | Presence/receipts | **D — Both** delivered/read receipts AND typing indicators |
| Q9 | Client platforms | **A — Mobile only** (React Native/Expo) |
| Q10 | Build/validation target | **C — Both** LocalStack local dev + AWS-ready Terraform (ap-south-1) |
| Q11 | Security extension | **A — Enabled (full, blocking)** |
| Q12 | Property-based testing | **A — Enabled (full, blocking; fast-check)** |

---

## Functional Requirements

### FR-1: Automatic Channel Creation (stream-driven)
- A `chatChannelCreator` Lambda subscribes to the existing DynamoDB stream
  (`NEW_AND_OLD_IMAGES`). When an acceptance row is written with `status = ACCEPTED`
  (verified key: `PK = BLOOD_REQ#<seekerId>`, `SK = ACCEPTED#<requestPostId>#<donorId>` — see
  `docs/architecture/Database.rst`), it creates a `ChatChannelDTO` with `status = OPEN`, scoped to
  `(seekerId, requestPostId, donorId)`. Stream filter: records whose `SK begins_with ACCEPTED#`.
- Creation MUST be **idempotent** — a duplicate/replayed stream event MUST NOT create a second
  channel (PBT-04 idempotency target).
- The channel stores a **context snapshot** at creation time (blood group, urgency, donation
  date/time, location) so it survives even if the underlying acceptance record is later deleted
  (e.g., IGNORED).

### FR-2: WebSocket Connection Lifecycle
- `chatConnect` (`$connect`): authenticate the user via Cognito, store the `connectionId`
  (+ `userId`, TTL) in DynamoDB. Reject unauthenticated/non-participant connections with `403`.
- `chatDisconnect` (`$disconnect`): remove the connection record.
- **Recommendation (residual)**: Native WebSocket clients cannot send Authorization headers
  reliably, so authentication uses a **Lambda REQUEST authorizer** on `$connect` that validates a
  Cognito JWT passed as a query-string parameter (`?token=`), then authorizes per-message access
  by checking channel participation in `chatSendMessage`.

### FR-3: Send Message (real-time + persistence)
- `chatSendMessage`: validate the sender is a participant of the target channel and the channel is
  `OPEN`; persist a `ChatMessageDTO`; deliver in real-time to all connected participants via
  `ApiGatewayManagementApi`.
- Message body is **Unicode text (supports emoji)**; enforce a max length (**Recommendation: 2000
  chars**) and reject other content types (SECURITY-05).
- Locked (`status != OPEN`) channels reject new messages (FR-7).

### FR-4: Message History
- `chatGetHistory` (REST): return **paginated, newest-first** message history scoped to a
  `(requestPostId, seekerId, donorId)` channel. **Recommendation: page size 20**, cursor-based
  pagination (DynamoDB `LastEvaluatedKey`).
- Caller MUST be a participant of the channel (SECURITY-08 object-level authorization).

### FR-5: Chat Inbox & Room (mobile)
- `ChatInbox` screen: lists the current user's channels with latest-message preview + **unread
  count badge**.
- `ChatRoom` screen: scrollable message list distinguishing sent vs. received bubbles.
- `ChatRoomHeader`: shows blood-request context (blood group, urgency, donation date, location)
  from the channel context snapshot.
- **Entry points**: a **"Chat"** button on the accepted-donor card in the seeker's
  `MyActivity → donorTracking` view, and on the active-donation card in the donor's `MyActivity`
  view.

### FR-6: Offline Message Queue (mobile)
- Messages composed while offline are queued locally and delivered on reconnection (ordered,
  de-duplicated). **Recommendation: client-generated `clientMessageId`** for idempotent delivery
  and dedup (PBT-04).

### FR-7: Channel Lifecycle / Locking
- On `AcceptDonationStatus → COMPLETED`, the channel transitions to `LOCKED`; no new messages
  accepted; history remains readable.
- On `AcceptDonationStatus → IGNORED`, **the channel remains `OPEN`** (per Q6=C) until TTL purge.
  *This is a deliberate deviation from the ticket's acceptance criterion that IGNORED also locks;
  recorded as an accepted scope decision.*
- Locked channels display the read-only banner: *"This chat is closed as the donation request is
  complete."*
- Lifecycle transitions are driven by the same `chatChannelCreator`/stream consumer reacting to
  acceptance-row status changes (COMPLETED) — keeps lifecycle logic in one place.

### FR-8: Push Notification Fallback (`CHAT_MESSAGE`)
- Extend `NotificationType` with `CHAT_MESSAGE`.
- When a message recipient is **not connected** via WebSocket, enqueue a push notification on the
  existing SQS push queue (→ `send-push-notification` → SNS APNs/FCM).
- The push deep-links the user directly to the correct `ChatRoom`
  (via `setup/notification` + `setup/navigation`).

### FR-9: Read Receipts & Typing Indicators (Q8=D)
- **Read receipts**: persist `lastReadAt` per participant per channel; expose delivered/read state.
  Unread count (FR-5) is derived from messages after the participant's `lastReadAt`.
- **Typing indicators**: ephemeral WebSocket event broadcast to the other participant; **not
  persisted** (Recommendation).

---

## Non-Functional Requirements

### NFR-1: Security (extension ENABLED — full, blocking)
- **SECURITY-01**: Chat tables use DynamoDB encryption at rest; all transport over TLS (WSS/HTTPS).
- **SECURITY-02**: WebSocket + REST API Gateway stages have access/execution logging enabled;
  CloudFront logging where applicable.
- **SECURITY-03**: Structured logging on every Lambda (existing logger infra) with correlation IDs;
  **no message content, tokens, or PII in logs**.
- **SECURITY-05**: Validate all WebSocket/REST inputs (type, max-length, allowlist); reject oversized
  payloads; parameterized DynamoDB access only.
- **SECURITY-06**: Least-privilege IAM — chat Lambdas scoped to specific table/queue/connection ARNs
  and actions (no wildcards).
- **SECURITY-08**: Object-level authorization on every channel/message access (participant check);
  Cognito JWT validated server-side on connect and per message; no IDOR.
- **SECURITY-11**: Rate limiting (FR rate-limit) on message send; security-critical chat-auth logic
  isolated in a dedicated module; abuse case (message flooding) addressed.
- **SECURITY-14**: Log retention ≥ 90 days; alerting on auth/authorization failures.
- **SECURITY-15**: Fail-closed error handling on all external calls; global handler per Lambda;
  generic user-facing errors.
- Remaining SECURITY rules (04 web headers, 07 network, 09 hardening, 10 supply chain, 12 auth, 13
  integrity) evaluated per-stage; web-header rule (04) is largely **N/A** (no new HTML endpoint).

### NFR-2: Data Retention
- Chat messages and channels carry a DynamoDB **TTL of 90 days**, after which they are
  automatically purged.

### NFR-3: Rate Limiting / Abuse Prevention
- Enforce **60 messages/minute/channel** server-side in `chatSendMessage`.
  **Recommendation: sliding-window counter** persisted in DynamoDB (per-channel, short TTL) so the
  limit holds across Lambda invocations; exceeding it returns a throttling error (mirrors existing
  `ThrottlingError` pattern in `bloodDonationWorkflow`).

### NFR-4: Real-time Delivery & Reliability
- Online participants receive messages in real-time over WebSocket.
- Offline participants get push fallback (FR-8) and full history on reconnect.
- Stale `connectionId`s (GoneException on post-to-connection) are cleaned up.

### NFR-5: Testing (PBT extension ENABLED — full, blocking)
- **Framework**: fast-check (integrates with the project's Jest setup).
- Unit tests for all new Lambda handlers, services, and repositories (project floor: ≥60% functions).
- **PBT targets** (carried into Functional Design per PBT-01):
  - Round-trip (PBT-02): `ChatMessageDTO` / `ChatChannelDTO` serialize↔deserialize; DynamoDB
    item marshal↔unmarshal; channel-key build↔parse.
  - Invariant (PBT-03): history is always returned newest-first; channel scope key always
    `(seekerId, requestPostId, donorId)`; unread count never negative; message length within bound.
  - Idempotence (PBT-04): channel creation from duplicate stream events; offline-queue delivery by
    `clientMessageId`.
  - Stateful (PBT-06): channel state machine `OPEN → LOCKED` (no LOCKED → OPEN; no send when LOCKED);
    unread-count model under message/read command sequences.
- Example-based tests pin critical scenarios (PBT-10): accept→channel created, COMPLETED→locked,
  non-participant rejected (403), push fallback when offline.

### NFR-6: Build / Deployment Target
- Code must build & test under **LocalStack** (`make start-dev` flow) and ship **AWS-ready
  Terraform** (ap-south-1). WebSocket API, stream event-source mapping, and IAM defined in
  `iac/terraform/aws/` following existing module patterns.

### NFR-7: Code Quality (existing repo rules)
- TypeScript strict, **no `any`**, single quotes, no semicolons, 150-char lines, arrow functions.

---

## Out of Scope (this iteration)
- Image/file attachments and structured "donation info" cards (Q3 = text + emoji only).
- Removing the donor phone number from the "Donor Found" notification (Q4 = keep for now).
- Locking IGNORED channels (Q6 = leave open until TTL).
- Web dashboards (organization, monitoring) — mobile only (Q9).
- Group chat / multi-donor single thread (channels remain 1:1 per acceptance triplet).

## Assumptions & Recommendations (residual ambiguities, per "add your recommendation")
1. **WebSocket auth** → Lambda REQUEST authorizer validating Cognito JWT from `?token=` query param.
2. **History pagination** → cursor-based, newest-first, page size 20.
3. **Message max length** → 2000 Unicode characters.
4. **Typing indicators** → ephemeral, not persisted; read receipts persisted via `lastReadAt`.
5. **Rate limiting** → DynamoDB sliding-window counter, 60/min/channel, throttling error on breach.
6. **Offline dedup** → client-generated `clientMessageId` for idempotent delivery.
7. **IGNORED channels** → remain OPEN with stored context snapshot until 90-day TTL.
8. **Single-table conventions** (as-built, per `docs/architecture/Database.rst`) → new chat
   entities live in the **same DynamoDB table**, distinguished by key prefixes; `#` delimiter;
   ISO-8601 timestamp segments for sortable sort keys; reuse overloaded **GSI1** (`GSI1PK`/`GSI1SK`)
   for the cross-partition access pattern the **Chat Inbox** needs (list all channels for a given
   user, who may be seeker in one and donor in another). Proposed prefixes (to finalize in design):
   `CHAT_CHANNEL#`, `CHAT_MSG#`, `CHAT_CONN#` (WebSocket connection). The 90-day TTL uses a numeric
   `ttl` attribute. **DynamoDB encryption at rest is already on the shared table** (SECURITY-01).

## Traceability — Ticket Acceptance Criteria → Requirements
- Backend AC → FR-1..FR-4, FR-7, FR-8, NFR-1, NFR-5.
- Mobile AC → FR-5, FR-6, FR-8, FR-9, NFR-5.
- Non-Functional AC → NFR-1 (encryption/auth/403), NFR-2 (TTL), NFR-3 (rate limit), plus OpenAPI
  `getHistory` documentation (FR-4).
- **Deviation**: Ticket "locked on COMPLETED or IGNORED" → narrowed to COMPLETED only (Q6=C).
