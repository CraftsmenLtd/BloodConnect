# U3 Real-time Messaging — Tech Stack Decisions

| Concern | Decision | Rationale |
|---|---|---|
| Transport | API Gateway **WebSocket** API (`$connect`/`$disconnect`/`sendMessage`/`typing`/`markRead`) | Ticket Q2=A; route selection on `action`. |
| Authorizer | Lambda **REQUEST** authorizer + **`aws-jwt-verify`** (Cognito) | AWS-official Cognito JWT verification with JWKS caching; native API GW authorizer can't read `?token=` for native WS clients. **New dep.** |
| Real-time delivery | **`@aws-sdk/client-apigatewaymanagementapi`** `PostToConnectionCommand` | Standard WS push-to-connection. **New dep.** |
| Push fallback | reuse `NotificationService` + existing SQS push queue (`CHAT_MESSAGE`) | No new infra; `ChatPushNotifier` (OfflineNotifier). |
| Lambda event types | `aws-lambda` (`APIGatewayProxyWebsocketEventV2` / request-authorizer types) | Already available. |
| Config | extend with Cognito **User Pool ID + Client ID** + WebSocket endpoint (new env vars) | Needed by authorizer + realtime adapter; wired in U3 Infra / U6. |
| Tests | Jest + **fast-check** (from U1) + **aws-sdk-client-mock** | Envelope round-trip + adapter mocks + handler examples. |

## New Dependencies (to add in U3 Code Gen, pinned + lockfile — SECURITY-10)
- **`aws-jwt-verify`** — Cognito JWT verification in the authorizer.
- **`@aws-sdk/client-apigatewaymanagementapi`** — real-time post-to-connection.

## Reused (no new dep)
- `NotificationService`, `SQSOperations`, `@aws-sdk/client-dynamodb`, U1 chat services, `Config`,
  logger, `aws-lambda` types, `fast-check`, `aws-sdk-client-mock`.

## New env/config (declared; wired in U3 Infra / U6)
- `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID` (authorizer), `WEBSOCKET_*` endpoint (realtime), reuse
  `NOTIFICATION_QUEUE_URL`.

## PBT-09 Compliance
- Framework already selected (fast-check); U3 adds a WS-envelope generator (PBT-07).
