# U3 Real-time Messaging — Functional Design Plan

> Answers pre-filled with recommendations per the user's standing instruction.

### Q-1 — WebSocket authorization
[Answer]: **Lambda REQUEST authorizer** `chatAuthorizer` on `$connect`, validating a **Cognito JWT** from
the `?token=` query-string param. Verify with **`aws-jwt-verify`** (new dep; AWS-official, JWKS caching).
Needs Cognito **User Pool ID + Client ID** (new env vars; wired in U3 Infra / U6). On success the
authorizer returns `principalId = userId (sub)` + `context.userId`.

### Q-2 — userId on message routes (authorizer context not propagated)
[Answer]: WebSocket authorizers only run on `$connect`; their context is **not** passed to subsequent
routes. So `chatConnect` persists `userId` with the connection, and message routes look it up by
`connectionId`. **Extend** U1's `ChatConnectionRepository`/`Service` with `getConnectionUser(connectionId)`
(additive).

### Q-3 — Real-time delivery
[Answer]: `ApiGatewayManagementApiOperations` implements `RealtimeNotifier` using
**`@aws-sdk/client-apigatewaymanagementapi`** (new dep) `PostToConnectionCommand`; on `GoneException`
collect the connectionId as stale (caller deletes it). Endpoint from `requestContext.domainName/stage`
or an env var.

### Q-4 — Push fallback boundary (U3 vs U4)
[Answer]: `chatSendMessage` requires an `OfflineNotifier` (port from U1). **U3 provides the backend
implementation** `ChatPushNotifier` — enqueues a `CHAT_MESSAGE` notification onto the existing SQS push
queue via `NotificationService.sendNotification` (so send is complete). **U4** then owns the REST
history endpoint + OpenAPI + the `CHAT_MESSAGE` **payload shaping for the mobile deep-link** and mobile
consumption. *(Minor refinement of the U3/U4 boundary — flagged for approval.)*

### Q-5 — WebSocket message/event envelope
[Answer]: Client→server frames: `{ action: 'sendMessage'|'typing'|'markRead', channelId, body?,
clientMessageId? }` (API GW route-selection on `action`). Server→client events: the U1
`ChatRealtimeEvent` (`MESSAGE | TYPING | READ_RECEIPT`), JSON-encoded.

### Q-6 — Handlers in scope
[Answer]: `chatAuthorizer`, `chatConnect`, `chatDisconnect`, `chatSendMessage`, `chatTyping`,
`chatMarkRead`. Each builds services with injected DynamoDB ops + realtime/offline adapters + logger.

## Checklist
- [x] business-logic-model.md (handler flows + RealtimeNotifier/OfflineNotifier impl semantics)
- [x] business-rules.md (auth, envelope validation, delivery, rate-limit reuse)
- [x] domain-entities.md (connection userId lookup extension; no new persisted entity)
