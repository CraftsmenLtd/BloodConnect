---
name: openapi-spec-change
description: Modifies the BloodConnect OpenAPI contract without adding a new Lambda — editing shared schemas, request/response components, request validators, tags, CORS options, server config, or the Swagger UI. Use when asked to "update the API schema", "change a request/response model", "fix the OpenAPI spec", "add a validator", "adjust a shared component", "tweak swagger-ui", or lint/bundle the contract. Excludes wiring a brand-new endpoint to a Lambda (use add-backend-endpoint).
---

# OpenAPI contract change

The spec is split under `openapi/` and bundled to a single `docs/openapi/v1.json` with Redocly before linting/serving. Reference: `docs/development/OpenApi.rst`.

## Layout

- `openapi/versions/v1.json` — root document: `info`, `tags`, `servers`, and the `paths` map (each path `$ref`s a file under `openapi/paths/`).
- `openapi/paths/<domain>/*.json` — operation definitions (method, requestBody, responses, validator, integration `$ref`, security).
- `openapi/integration/aws/<domain>/*.json` + `vtl/` — API Gateway integrations and VTL templates (touch only when changing an existing endpoint's mapping).
- `openapi/components/schemas/<domain>/*.json` — reusable request/response schemas referenced by `$ref` (e.g. `donations/create-request-payload.json`, plus `common-schemas.json`).
- `openapi/validators.json` — request validators, e.g. `ValidateBodyAndQuery` (`validateRequestParameters` + `validateRequestBody`); referenced by `x-amazon-apigateway-request-validator`.
- `openapi/configs/redocly.yaml` (+ `plugins/`) — Redocly bundle config, including the `#importVtl` plugin.
- `openapi/.spectral.json` — Spectral ruleset for linting.
- `openapi/swagger-ui/` — `setup-swagger.sh`, `index.html`, nginx; served via `openapi/docker-compose.yml`.

## Checklist

1. Edit the right file: shared model → `openapi/components/schemas/...`; validator → `openapi/validators.json`; tag/server/path registration → `openapi/versions/v1.json`; response shapes/CORS → the relevant `openapi/paths/<domain>/*.json`.
2. Keep `$ref` paths relative and correct — they are resolved at bundle time. CORS headers (`Access-Control-Allow-Origin/Methods/Headers`) and `security: [{ CognitoAuthorizer: [] }]` follow the existing operations' conventions.
3. `make bundle-openapi` — bundles `openapi/versions/v1.json` → `docs/openapi/v1.json` via Redocly using `openapi/configs/redocly.yaml`. Fails fast on broken refs.
4. `make lint-api` — bundles then Spectral-lints against `openapi/.spectral.json`. Must pass.
5. Preview interactively (optional): `make swagger-ui branch=<branch> email=<email> password=<password>` — runs `setup-swagger.sh` and brings up the Swagger UI via docker compose.
6. `make lint` (includes `lint-api`) as the gate. If the contract is consumed by mobile types, regenerate/update those too.

## Gotchas

- Always regenerate the bundle (`make bundle-openapi`) after edits — `docs/openapi/v1.json` is the artifact Spectral, Swagger UI, and Sphinx (`make sphinx-html`) consume; stale bundles hide errors.
- Don't edit `docs/openapi/v1.json` by hand; it is generated.
- A schema change that alters the request shape usually also needs the VTL request template and the handler `event` type updated — that crosses into add-backend-endpoint territory.
- `#importVtl` references inside integration JSON are resolved by a Redocly plugin in `openapi/configs/plugins/`; keep VTL paths relative to `openapi/integration/aws/`.
