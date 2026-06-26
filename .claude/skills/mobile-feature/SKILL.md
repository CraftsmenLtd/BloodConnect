---
name: mobile-feature
description: Builds a feature screen in the BloodConnect Expo/React-Native app (clients/mobile) — workflow-folder structure, React Navigation registration, the FetchClient/Amplify-auth data layer, and i18n (en/bn). Use when asked to "add a mobile screen", "build a feature in the app", "add a screen to navigation", "wire a mobile API call", "add translations", or work in clients/mobile. Excludes the web clients clients/organization and clients/monitoring (Vite + React 19) — this skill is mobile-only.
---

# Mobile feature screen (clients/mobile)

The mobile app is Expo + React Native, organized by **workflow folders** under `clients/mobile/src/`: `donationWorkflow`, `userWorkflow`, `myActivity`, `authentication`, `welcome`, plus shared `components`, `hooks`, `api`, `LocationService`, `utility`, and `setup`. Reference: `docs/development/MobileAppDevelopment.rst`.

## Anatomy of a feature

A feature is a folder inside the relevant workflow with this shape (see `donationWorkflow/createUpdateDonation/`, `userWorkflow/personalInfo/`):
- `UI/<Screen>.tsx` — the screen component (default-exported, registered in navigation).
- `hooks/use<Feature>.ts(x)` — state + side-effects; calls the data layer.
- co-located `types.ts`, helpers, and styles.

## Checklist

1. **Create the feature folder** under the correct workflow, with `UI/<Screen>.tsx` and a `hooks/use<Screen>.ts(x)`. Keep business/network logic in the hook, presentation in the UI component.
2. **Data layer** — use the shared HTTP client in `clients/mobile/src/setup/clients/`: `useFetchClient.ts` / `useFetchData.ts` (over `FetchClient.ts` / `HttpClient.ts`), or a domain service like `donationWorkflow/donationService.ts`. Cross-cutting hooks live in `clients/mobile/src/api/hooks/`.
3. **Auth** — Amplify (`aws-amplify`) auth is centralized in `clients/mobile/src/authentication/services/authService.ts`; obtain tokens/session through it rather than calling Amplify directly in screens.
4. **Navigation** — register the screen:
   - Add a screen key to `clients/mobile/src/setup/constant/screens` (`SCREENS`).
   - Add a route entry in `clients/mobile/src/setup/navigation/routes.ts` importing your `UI/<Screen>`.
   - Add typed params in `clients/mobile/src/setup/navigation/navigationTypes.ts`; tab-level screens go through `BottomNavigation.tsx`. The stack is built in `Navigator.tsx`.
5. **i18n** — never hardcode user-facing strings. Add keys to BOTH locales under `clients/mobile/src/setup/language/locales/en` and `.../bn`, and consume via the i18n hook configured in `setup/language/i18n.tsx`.
6. **Theme & shared UI** — reuse `clients/mobile/src/components/` and the theme from `setup/theme` instead of ad-hoc styling.

## Env, run, test

- Generate env from Terraform outputs: `make prepare-mobile-env` (writes `clients/mobile/.env` with `AWS_USER_POOL_CLIENT_ID`, `AWS_USER_POOL_ID`, `API_BASE_URL`, `AWS_COGNITO_DOMAIN`).
- Run the dev server: `make start-expo` (from `clients/mobile/Makefile`).
- Tests: `clients/mobile` is its own Jest project (`preset: jest-expo`, `clients/mobile/jest.config.ts`). Run via the root `make test` (it's one of the Jest `projects`) or within the workspace.
- `make lint` covers the workspace via ESLint.

## Gotchas

- This skill is for `clients/mobile` only. `clients/organization` and `clients/monitoring` are separate Vite + React 19 web apps with different routing/build — do not apply these conventions there.
- Both `en` and `bn` locale files must stay in sync; a missing `bn` key surfaces as a raw key string.
- Backend changes a screen depends on (new endpoint/schema) belong to add-backend-endpoint / openapi-spec-change; this skill consumes the contract, not defines it.
- The app needs a populated `clients/mobile/.env`; against a local stack run `make prepare-mobile-env` after the LocalStack deploy (see local-dev-localstack).
