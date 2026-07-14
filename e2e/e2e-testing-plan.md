# Plan: BDD (Gherkin) e2e tests against the REAL staging environment via the public API

> Status: **proposal — not yet implemented.** No code or config has been changed.

## What changed from the previous draft

This supersedes the earlier LocalStack + direct-Lambda-invoke plan. Per direction:

1. **Real environment only** — tests run against a real deployed AWS environment. No LocalStack, no
   virtual/local backend.
2. **No jest-cucumber** — use the official **`@cucumber/cucumber` (cucumber-js)** instead (rationale below).
3. **Local-first, pipeline-later** — the suite is built to run from a developer machine now; a GitHub
   Actions job is added later as a separate, non-PR check.
4. **Public API endpoints only** — this is true e2e. Tests never invoke Lambda/DynamoDB/SQS/SES directly.
   The only interfaces used are the same public ones the app uses: the Cognito user-pool client and the
   HTTPS REST API behind the Cognito authorizer.

## Confirmed decisions

- **Target environment:** the real **staging** deployment. Non-prod domains resolve to
  `https://<environment>.bloodconnect.net` (`iac/terraform/aws/local.tf:17`), so the API base URL is
  `https://<stage-env>.bloodconnect.net/api`. Exact subdomain comes from the stage environment name
  (`STAGE_GITHUB_ENVIRONMENT_GROUP`); it is read from config, never hardcoded. It is **also exported as the
  `aws_api_domain_url` Terraform output** (`iac/terraform/aws/outputs.tf:25`) for reference.
- **Auth:** real Cognito. The app user-pool client allows `USER_PASSWORD_AUTH` with **no client secret**
  (`iac/terraform/aws/cognito/cognito.tf:149,156`), so login is scriptable with just email+password.
- **Full-fidelity signup with automated email OTP:** `auto_verified_attributes = ["email"]` and
  `phone_number` is not required/verified (`cognito.tf:31,52`), so signup needs **only the email OTP** — no
  SMS. Tests exercise the entire real signup: Cognito `SignUp` → read OTP from a test-mail inbox →
  `ConfirmSignUp` (fires the `post_confirmation` trigger that provisions the user + `custom:userId`,
  `cognito.tf:57`) → `InitiateAuth` for the IdToken → `POST /users` to complete the donor profile.
- **Framework:** official **cucumber-js**, `.feature` files preserved so scenarios map to acceptance criteria.
- **Cleanup on shared staging:** **TODO — deferred** (see Open TODOs). For now, every run uses unique,
  tagged identities/data so runs don't collide.

## Why cucumber-js, not jest-cucumber

`jest-cucumber` is a thin single-maintainer community wrapper whose only real advantage was reusing the Jest
runner — a premise this plan drops anyway. `@cucumber/cucumber` is the official, well-maintained Gherkin
runner. We keep business-readable `.feature` files without depending on a niche shim. Trade-off accepted:
cucumber-js's runner is more basic than Playwright's (no built-in retry/trace, hand-rolled polling), so we
add a small `pollUntil` helper for eventual-consistency assertions.

## Why API-through-Cognito is the correct e2e boundary

Requests traverse the real path: **Cognito-issued JWT → API Gateway (Cognito authorizer + request
validation + OpenAPI integration mapping) → Lambda → DynamoDB → SQS/SNS/SES → async notification**. We assert
only on what a real client can observe: HTTP responses and subsequent API reads. Async effects (the
accept→notification hop) are verified by **polling a read endpoint** until the state appears — never by
inspecting SQS/DynamoDB (which rule #4 forbids and which a real client couldn't see anyway).

## Endpoints under test (all `CognitoAuthorizer`-protected, `openapi/versions/v1.json`)

| Flow step | Method + path | operationId |
|---|---|---|
| Complete profile | `POST /users` | `CreateUser` |
| Create blood request | `POST /donations` | `CreateDonation` |
| List own requests | `GET /donations` | `GetDonations` |
| Get one request | `GET /donations/{requestPostId}/{createdAt}` | `GetDonations` |
| Donor feed (geo) | `GET /donations/blood-requests` | `GetNearbyBloodRequests` |
| Donor accepts/declines | `PATCH /donations/responses` | `UpdateDonationResponse` |
| Read responses | `GET /donations/responses` | `GetDonationResponses` |
| Complete donation | `POST /donations/complete` | `CompleteDonation` |
| Cancel request | `PATCH /donations/cancel` | `CancelBloodDonation` |

## Approach

New top-level `e2e/` workspace (test-only; not shipped). A thin harness signs users in against real Cognito,
calls the real HTTPS API, and asserts on responses + follow-up reads. `.feature` files describe scenarios;
step definitions glue them via cucumber-js.

### 1. Dependencies (new `e2e/package.json`, isolated from app workspaces)
- `@cucumber/cucumber` — official Gherkin runner.
- `@aws-sdk/client-cognito-identity-provider` — public auth calls (`SignUp`, `ConfirmSignUp`, `InitiateAuth`).
  These are the app's own auth operations, **not** backend AWS management — consistent with "no direct AWS".
- HTTP: native `fetch` (Node ≥ 20 — already required) or `axios`; no other runtime needed.
- Assertions: `chai` or Node's built-in `node:assert/strict` (kept off Jest so the two runners stay separate).
- TS execution: `ts-node`/`tsx` register for cucumber-js.

### 2. Configuration (`e2e/support/config.ts`)
All environment-specific values come from env vars / a git-ignored `e2e/.env` (never committed):
- `E2E_API_BASE_URL` — e.g. `https://<stage-env>.bloodconnect.net/api`.
- `E2E_COGNITO_USER_POOL_ID`, `E2E_COGNITO_CLIENT_ID`, `E2E_AWS_REGION` (`ap-south-1`).
- Test-mail provider credentials (see step 4) — TODO until provider chosen.
- An `e2e/.env.example` documents every key.

### 3. Auth harness (`e2e/support/auth.ts`)
- `signUpConfirmAndLogin({ name, password })` — orchestrates the full real signup:
  1. allocate a unique inbox address from the mail client,
  2. Cognito `SignUp`,
  3. `mail.waitForOtp(address)` → `ConfirmSignUp`,
  4. `InitiateAuth` (USER_PASSWORD_AUTH) → returns `{ idToken, sub, email }`.
- `completeProfile(idToken, profile)` — `POST /users` with blood group / location so the user is a valid
  donor/seeker (required before create/accept scenarios).
- `login(email, password)` — IdToken-only path for reusing an already-registered identity.
- The IdToken is sent as the `Authorization` header on every API call.

### 4. Test-mail abstraction (`e2e/support/mail/`) — provider = TODO
- `MailClient` interface: `allocateAddress(): Promise<string>` and
  `waitForOtp(address, { timeoutMs }): Promise<string>` (parses the Cognito verification code).
- Ship an interface + a `TODO`/stub implementation now; wire a concrete provider (Mailosaur / MailSlurp /
  Testmail.app) when selected. Keeping this behind an interface means the provider choice never leaks into
  step definitions.

### 5. API client (`e2e/support/apiClient.ts`)
- `request(method, path, { token, body, query })` → returns `{ status, body }`, base-URL-prefixed.
- Typed thin wrappers per endpoint in the table above.
- `pollUntil(fn, { timeoutMs, intervalMs })` for eventual-consistency reads (accept→notification). No fixed
  sleeps.

### 6. World (`e2e/support/world.ts`)
- cucumber-js custom `World`: holds the current actor(s) (seeker/donor tokens + ids), created
  `requestPostId`/`createdAt`, and last response — shared across steps in a scenario. Unique run id +
  tagged data for isolation.

### 7. Feature files (`e2e/features/`) — initial scenarios
- `blood-donation-request.feature`
  - Seeker (real signup) creates a request → 201 with `requestPostId`; `GET` the request returns matching
    attributes.
  - Validation: missing/invalid required field → 4xx error.
- `accept-donation-request.feature`
  - Given a request and a separate donor identity, donor sees it in `GET /donations/blood-requests`, accepts
    via `PATCH /donations/responses` → 200; **`pollUntil`** the response/notification is observable through a
    read endpoint (proves the async path ran end-to-end).
  - Duplicate/invalid acceptance → error.
- `complete-donation-request.feature`
  - Accepted request → `POST /donations/complete` → 200; status transition visible on read.
- `cancel-donation-request.feature`
  - Seeker cancels an open request → 200; no longer appears in the donor feed.
- (optional, later) `nearby-blood-requests.feature` — geolocation filtering of the donor feed.

Step definitions in `e2e/steps/*.steps.ts` via cucumber-js `Given/When/Then`.

### 8. cucumber-js wiring
- `e2e/cucumber.js` (or `cucumber.mjs`) config: `paths` → `e2e/features/**/*.feature`,
  `require`/`import` → steps + support, TS loader, longer default timeout (real network + async flows),
  `--publish-quiet`, HTML/JSON formatter for a run report.
- `e2e/package.json` scripts:
  - `test:e2e` → `cucumber-js`
  - `test:e2e:smoke` → `cucumber-js --tags @smoke` (a fast subset for pipeline gating later)
- Kept **entirely separate** from root `jest.config.ts` and `npm test`, so unit tests stay fast and this
  never runs by accident.

### 9. Local run model (now)
- Developer copies `e2e/.env.example` → `e2e/.env`, fills the staging API URL + Cognito ids + mail creds,
  then `npm --prefix e2e run test:e2e`.
- No `make start-dev` / LocalStack — the target is the already-deployed staging environment.

### 10. Pipeline (later — documented, not wired yet)
- A new GitHub Actions job (e.g. `e2e-staging`) that runs `test:e2e` **after** `deploy-stage.yml` finishes,
  or on a nightly schedule — **not** on every PR. Secrets: staging Cognito ids, mail-provider key, test
  passwords. This is intentionally deferred; the plan leaves a clearly marked stub so the local suite is
  usable first.

### 11. Docs (`e2e/README.md`)
- How to configure `.env`, run locally against staging, add a scenario, and the auth/mail flow. Notes that
  the suite hits a **real shared environment** and the cleanup TODO.

## Files to create / modify

Create:
- `e2e/features/*.feature`, `e2e/steps/*.steps.ts`, `e2e/support/*.ts`, `e2e/support/mail/*`,
  `e2e/cucumber.js`, `e2e/package.json`, `e2e/.env.example`, `e2e/README.md`.

Modify:
- Root `package.json` / docs only if we want a convenience passthrough script (optional). No app code,
  no Terraform, no Lambda changes.

Reuse (no change): OpenAPI contract for endpoint shapes; DTOs under `commons/dto` for request/response types
if we want typed payloads.

## Verification

1. With a valid staging `.env`, `npm --prefix e2e run test:e2e` runs the request/accept/complete/cancel
   features green against real staging.
2. Full signup really happens: a fresh unique inbox receives a Cognito OTP each run and the user can then
   authenticate (proves real Cognito, not a stub).
3. Async proof: the accept scenario only passes after `pollUntil` observes the response via a read endpoint
   — i.e., the real async path executed.
4. Isolation-by-uniqueness: run twice back-to-back; unique run ids keep both green (pending real cleanup).
5. `npm test` (unit) is unchanged and does not pick up e2e specs.

## Open TODOs (explicitly deferred)

- **[TODO] Test-data cleanup strategy on shared staging.** No direct DB access, so options are API-only
  cleanup (`PATCH /donations/cancel`, any delete endpoints) + tagged data, or periodic manual wipe. Decide
  later; until then rely on unique ids.
- **[TODO] Test-mail provider selection** (Mailosaur / MailSlurp / Testmail.app) — wire the concrete
  `MailClient` behind the interface.
- **[TODO] Confirm the exact staging subdomain** (`STAGE_GITHUB_ENVIRONMENT_GROUP` value) for the base URL.
- **[TODO] GitHub Actions `e2e-staging` job** — post-deploy/nightly, non-PR, with the secrets above.
- **[TODO] Reusable test identities vs. fresh-signup-per-run** — fresh signup is highest fidelity but slower
  and creates more residue; may later cache a pool of confirmed users for speed once cleanup exists.

## Out of scope (proposed follow-ups)
- Mobile (React Native) e2e — needs Detox/Maestro/Appium; cucumber-js/Playwright can't drive the RN app.
- Web-dashboard UI e2e (organization/monitoring) — separate track (would favor Playwright).
- Donor-search wave / EventBridge-scheduler deep scenarios beyond the accept-notification hop.

## Note on repo AIDLC workflow
`CLAUDE.md` defines a heavier staged workflow (audit.md, aidlc-state.md, requirements/user-stories docs).
This is the lightweight equivalent; say so if you want the full AIDLC paper trail generated for this change.
