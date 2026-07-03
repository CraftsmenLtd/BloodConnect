# Build Instructions — Issue #571 In-app Chat

## Prerequisites
- **Node.js** ≥ 20, **npm** (workspaces), **Docker** (LocalStack), **Terraform**, **redocly** + **spectral** (OpenAPI), AWS creds for real deploys. Region `ap-south-1`.
- New deps already declared: `fast-check` (root, dev), `aws-jwt-verify` + `@aws-sdk/client-apigatewaymanagementapi` + `@aws-sdk/util-dynamodb` (`core/services/aws`).

## Build Steps
### 1. Install dependencies
```bash
npm install            # installs fast-check, aws-jwt-verify, apigatewaymanagementapi, util-dynamodb
```

### 2. Build Lambdas (esbuild) — includes the 9 chat handlers
```bash
make build-node-all
# verifies: chatAuthorizer.js, chatConnect.js, chatDisconnect.js, chatSendMessage.js,
#           chatTyping.js, chatMarkRead.js, chatChannelCreator.js, chatGetHistory.js, chatListChannels.js
```

### 3. Bundle + lint OpenAPI (new chat paths)
```bash
make bundle-openapi    # redocly bundles openapi/versions/v1.json (now incl. /chat/history, /chat/channels)
make lint-api          # spectral lint
```

### 4. Validate Terraform (chat module)
```bash
terraform -chdir=iac/terraform/aws fmt -check
terraform -chdir=iac/terraform/aws validate     # requires terraform init against a backend/provider
```

### 5. Type-check + lint
```bash
npm run type-check
npm run lint
```

## Expected output / artifacts
- 9 chat Lambda bundles + zips under `core/services/aws/.build/`.
- `docs/openapi/v1.json` bundle includes the two chat REST paths.
- Terraform `chat` module + root `module "chat"` plan-clean.

## Known / acceptable
- **Pre-existing repo type errors** (not chat): `DonorSearchService.ts:390`, `DonationNotificationDynamoDbOperations.ts:28` — present on `master` before this work; do not block the chat feature.
- Non-handler helpers `core/services/aws/chat/ChatPushNotifier.ts` + `websocketTypes.ts` produce unused bundles (no `lambda_option` references them) — harmless; relocate under `commons/` in a cleanup PR.

## Troubleshooting
- **esbuild can't find a chat handler** → ensure `make build-node-all` ran after `npm install`.
- **OpenAPI bundle fails** → check the `$ref`s in `openapi/paths/chat/*.json` resolve (schemas + integration files exist).
- **terraform validate: unknown module output** → confirm `module.database` (./dynamodb), `module.notification`, `module.cognito` expose the referenced outputs (they do on current master).
