# U4 History + Push — Tech Stack Decisions

| Concern | Decision | Rationale |
|---|---|---|
| REST handler | reuse `generateApiGatewayResponse` + `createHTTPLogger` (existing) | Matches every other REST handler. |
| Domain | reuse U1 `ChatMessageService.getHistory` + `ChatChannelService` | No duplication. |
| Cursor | base64(JSON) of `LastEvaluatedKey` (Node `Buffer`) | Opaque, no new dep. |
| Push | reuse `NotificationService` + existing SQS→SNS path; add `CHAT_MESSAGE` publish-only branch | Minimal change; no new infra. |
| OpenAPI | JSON path + integration + schema (existing Redocly/Spectral toolchain) | Matches `openapi/paths/*`. |
| Tests | Jest + fast-check (cursor round-trip) + handler examples | Existing toolchain. |

## New Dependencies
- **None.**

## New env/config
- **None** beyond existing (`DYNAMODB_TABLE_NAME`, `awsRegion`). REST route/integration + IAM wired in U6.

## PBT-09 Compliance
- fast-check already selected; U4 adds a key-map generator for the cursor round-trip (PBT-07).
