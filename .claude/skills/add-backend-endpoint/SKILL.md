---
name: add-backend-endpoint
description: Adds a full HTTP endpoint vertical slice to the BloodConnect serverless backend — a domain service method in core/application/<workflow>/, a Lambda handler in core/services/aws/<domain>/, the Terraform lambda registration, and the OpenAPI path + AWS integration + VTL request/response templates. Use when asked to "add an API endpoint", "create a new Lambda route", "expose X over the API", "add a POST/GET/PATCH to the backend", or wire a new operation end-to-end. Excludes creating a new DynamoDB entity (use add-dynamodb-model) and writing the Jest tests (use write-backend-tests).
---

# Add a backend HTTP endpoint

A BloodConnect endpoint is a vertical slice across four layers. Follow them in order. Domain logic lives in `core/application` (pure, hexagonal); AWS adapters live in `core/services/aws`; infra in `iac/terraform/aws`; contract in `openapi`.

Reference implementation to copy: `createBloodDonation` (handler `core/services/aws/bloodDonation/createBloodDonation.ts`, service `core/application/bloodDonationWorkflow/BloodDonationService.ts`).

## Checklist

1. **Domain service method** in `core/application/<workflow>/<Domain>Service.ts` (e.g. `BloodDonationService.ts`).
   - Add an `async` method on the service class. Take typed attributes, return a typed response.
   - Validate inputs with `validateInputWithRules(inputs, validationRules)` from `core/application/utils/validator.ts`; rules live in the workflow's `Types.ts` (e.g. exported `validationRules`). On failure throw the domain error with a `GENERIC_CODES` code.
   - Throw the workflow's typed error (e.g. `core/application/bloodDonationWorkflow/BloodDonationOperationError.ts`, which extends `commons/libs/errors/ApplicationError`) — `new BloodDonationOperationError(message, GENERIC_CODES.BAD_REQUEST)`.
   - The service depends only on a repository interface + `Logger` injected via the constructor — never import AWS SDK here.
   - Add request/response types to the workflow's `Types.ts`.

2. **Lambda handler** in `core/services/aws/<domain>/<operation>.ts`. Mirror `createBloodDonation.ts` exactly:
   - `const config = new Config<{ dynamodbTableName: string; awsRegion: string }>().getConfig()` from `commons/libs/config/config`.
   - Instantiate the DDB operations adapter(s) once at module scope with `config.dynamodbTableName, config.awsRegion`.
   - Export `default async function <operation>Lambda(event: <Attributes> & HttpLoggerAttributes)`. The default export name is referenced by Terraform `handler` as `<fileName>.default`.
   - Build the logger first: `const httpLogger = createHTTPLogger(event.<userId>, event.apiGwRequestId, event.cloudFrontRequestId)` from `core/services/aws/commons/logger/HttpLogger`.
   - Construct the domain service with the adapter + `httpLogger`, call it inside `try`.
   - Success: `return generateApiGatewayResponse({ success: true, message: <MSG>, data: response }, HTTP_CODES.CREATED)` — `generateApiGatewayResponse` from `core/services/aws/commons/lambda/ApiGateway.ts`, `HTTP_CODES` from `commons/libs/constants/GenericCodes`, messages from `commons/libs/constants/ApiResponseMessages.ts`.
   - Error: `httpLogger.error(error)`, then return `generateApiGatewayResponse(\`Error: ${errorMessage}\`, errorCode)` where `errorCode = error instanceof <DomainError> ? error.errorCode : HTTP_CODES.ERROR`.

3. **Terraform lambda registration** in `iac/terraform/aws/<domain>/lambdas.tf` — add an entry to the `local.lambda_options` map (the `module.lambda` in `modules.tf` iterates it via `for_each`). Required keys: `name`, `handler` (`<fileName>.default`), `js_file_name` (`<fileName>.js`), `statement` (concat of `local.policies.*`, defined in `policies.tf`), and `invocation_arn_placeholder` (SCREAMING_SNAKE, e.g. `CREATE_BLOOD_DONATION_INVOCATION_ARN`) — this exact string must match the OpenAPI integration `uri`. Add `env_variables`, and `memory_size`/`timeout` only if non-default. The shared module is `iac/terraform/aws/lambda`.

4. **OpenAPI contract** under `openapi/`:
   - Path: add the method to `openapi/paths/<domain>/<resource>.json`. Set `operationId`, `tags`, `requestBody` `$ref` to a schema in `openapi/components/schemas/`, the `200` response with the three `Access-Control-*` headers, `"x-amazon-apigateway-request-validator": "ValidateBodyAndQuery"` (defined in `openapi/validators.json`), `"x-amazon-apigateway-integration": { "$ref": "./../../integration/aws/<domain>/<method>-<resource>.json" }`, and `security: [{ "CognitoAuthorizer": [] }]`.
   - Integration: create `openapi/integration/aws/<domain>/<method>-<resource>.json` like `post-donation.json` — `"type": "aws"`, `httpMethod`, `"uri": "${YOUR_INVOCATION_ARN_PLACEHOLDER}"`, `requestTemplates` `#importVtl <domain>/vtl/requestTemplates/<file>.vtl`, default response with CORS `responseParameters` + response template, `"passthroughBehavior": "never"`.
   - VTL: create `openapi/integration/aws/<domain>/vtl/requestTemplates/<file>.vtl` (and a `responseTemplates/` counterpart). The request VTL maps API Gateway input to the handler `event`. Inject the authenticated user from the Cognito claim: `"<userId>": "$context.authorizer.claims['custom:userId']"`, plus `cloudFrontRequestId`, `apiGwRequestId`, and the body fields (quote strings, leave numbers unquoted — see `post-donation.vtl`).
   - Register the route in `openapi/versions/v1.json` `paths` only if the URL path is new.

5. **Validate** before finishing:
   - `make lint-api` (bundles with Redocly then Spectral-lints) — catches broken `$ref`s and contract errors.
   - `make bundle-openapi` to confirm the spec bundles.
   - `make lint` (ESLint + `tf-validate` + OpenAPI) and `make test` as the full quality gate.

## Gotchas

- The Terraform `handler` value and `js_file_name` derive from the compiled JS filename; keep the TS filename, default export, and these fields consistent.
- The `invocation_arn_placeholder` string is the contract between Terraform and the OpenAPI `uri` — a typo silently produces a 500.
- Do not reach into DynamoDB from the domain service; inject a repository adapter (see add-dynamodb-model).
- Reference doc: `docs/devops/LambdaOpenapiIntegration.rst`.
- Write tests separately via write-backend-tests.
