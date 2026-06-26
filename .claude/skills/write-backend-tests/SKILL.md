---
name: write-backend-tests
description: Writes Jest unit tests for the BloodConnect backend — Lambda handlers and domain services in core/services/aws and core/application — following the repo's multi-project Jest setup and mock conventions (mockRepositories, mockLogger, mock*Data, jest.mock of services/adapters). Use when asked to "write tests for this handler/service", "add backend unit tests", "test the Lambda", "increase coverage", or after implementing an endpoint/model. Excludes mobile (clients/mobile) tests.
---

# Write backend Jest tests

Tests are run from the repo root via Jest projects. `jest.config.ts` defines `projects: ['core/application', 'core/services/aws', 'core/services/maps', 'clients/mobile']`, `collectCoverage: true`, and `coverageThreshold.global.functions: 60` — keep function coverage at/above 60%. The root script is `jest --runInBand`.

## Where tests live

- Handler tests: `core/services/aws/tests/<domain>/<handler>.test.ts` (mirrors `core/services/aws/<domain>/`).
- Domain-service tests: `core/application/tests/<workflow>/...`.
- DB-model tests: `core/services/aws/tests/dbModels/`.
- Shared mocks: `core/application/tests/mocks/` — `mockRepositories.ts`, `mockLogger.ts`, `mockUserData.ts`, `mockDonationRequestData.ts`, `mockDonationAcceptanceData.ts`, `mockCognitoUserData.ts`.

## Handler test pattern

Copy `core/services/aws/tests/bloodDonation/createBloodDonation.test.ts`. Mock every collaborator so the test exercises only the handler's glue:

1. `jest.mock(...)` the domain service(s), any other service, and `'../../commons/lambda/ApiGateway'`.
2. Mock the logger factory explicitly so its methods are jest fns:
   ```ts
   jest.mock('../../commons/logger/HttpLogger', () => ({
     createHTTPLogger: jest.fn(() => ({ error: jest.fn(), info: jest.fn(), warn: jest.fn(), debug: jest.fn() }))
   }))
   ```
3. Cast mocks: `const mockSvc = <Service> as jest.MockedClass<typeof <Service>>`, `const mockGenerateApiGatewayResponse = generateApiGatewayResponse as jest.Mock`.
4. Build the event from a `mock*Data` fixture. `afterEach(() => jest.clearAllMocks())`.
5. Cover: success path (assert `generateApiGatewayResponse` called with `{ success: true, data, message }` and `HTTP_CODES.CREATED`), a thrown standard `Error`, the domain error with a custom `errorCode` (e.g. `BloodDonationOperationError` with `HTTP_CODES.NOT_FOUND`), a non-Error rejection (default `An unknown error occurred`), and any special code such as `TOO_MANY_REQUESTS`.

## Domain-service test pattern

- Instantiate the real service with `mockRepository` (from `mockRepositories.ts` — `{ create, update, getItem, query, delete }` jest fns) and `mockLogger`.
- Drive behaviour with `mockRepository.create.mockResolvedValue(...)` / `.mockRejectedValue(...)`.
- Assert validation throws the typed error with the right `GENERIC_CODES`, and that repository methods receive the correctly-mapped DB payload.

## Commands

- `make test` — runs `npm run test -- $(NPM_TEST_ARGS)`; pass a path/pattern via `NPM_TEST_ARGS`, e.g. `make test NPM_TEST_ARGS="core/services/aws/tests/bloodDonation/createBloodDonation.test.ts"`.
- Direct: `npm run test -- <pattern>` (root). Tests run `--runInBand`.
- `make lint` before finishing (ESLint covers test files too).

## Gotchas

- Tests are `type: module` ESM with `ts-jest`; import with the same relative paths as source (no `.js` suffix in test imports here).
- Coverage is global across all backend projects — a new untested handler can drop the build under the 60% function threshold. Add tests for every new exported function.
- Use the shared `mock*Data` fixtures rather than hand-building DTOs so shape stays in sync with `commons/dto`.
- `clients/mobile` is a separate Jest project (`jest-expo` preset) — out of scope here.
