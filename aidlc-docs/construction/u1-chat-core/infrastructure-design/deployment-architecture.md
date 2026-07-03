# U1 Chat Core — Deployment Architecture

## Packaging
- U1 ships as TypeScript modules within the existing monorepo workspaces:
  - Domain: `core/application/chatWorkflow/*` + ports under `core/application/models/...`.
  - Adapters: `core/services/aws/commons/ddbModels/Chat*Model.ts` +
    `core/services/aws/commons/ddbOperations/Chat*DynamoDbOperations.ts`.
  - DTOs: `commons/dto/Chat*DTO.ts` + `NotificationType.CHAT_MESSAGE`.
- No standalone deployable for U1 — it is consumed by the U2/U3/U4 Lambdas (bundled via esbuild,
  `make build-node-all`).

## Environments
- **LocalStack** (`deployment/localstack`) and **AWS** (`iac/terraform/aws`, ap-south-1) — both get
  the TTL block via the shared `dynamodb` module.

## Build & Test
- `npm run type-check`, `npm run lint`, `npm test` (Jest + ts-jest, ≥60% functions).
- New devDependency **fast-check** added to the relevant workspace(s) for PBT.

## Rollout / Rollback
- **Rollout**: enabling TTL is additive and non-destructive; deploy with the next Terraform apply.
- **Rollback**: TTL can be disabled without data loss (stops expiry); chat code is unused until
  U2/U3 wire handlers, so U1 alone has no runtime surface to roll back.

## Validation
- Confirm `aws dynamodb describe-time-to-live` (or LocalStack equivalent) reports `ENABLED` on
  attribute `ttl` after apply.
