# AI-DLC State Tracking

## Project Information
- **Project Name**: BloodConnect — In-app Chat (Issue #571)
- **Project Type**: Brownfield
- **Start Date**: 2026-06-26T00:05:00Z
- **Current Phase**: CONSTRUCTION
- **Current Stage**: Build and Test complete (awaiting approval); next: Operations (placeholder). All 6 units done.
- **Final verification**: 106 chat tests pass (25 suites, 3 projects); chat type-check clean (0 new errors; 2 repo errors pre-existing); ESLint clean; OpenAPI chat JSON valid + registered. Deploy/integration/e2e = operator env (instructions in aidlc-docs/construction/build-and-test/).
- **U6 Verification**: 8 chat Terraform files + root wiring authored; all 7 chat OpenAPI JSON valid + paths registered in v1.json; module references verified to exist. terraform validate + LocalStack/AWS = Build-and-Test (operator env).
- **Per-Unit Progress**: U1–U4 ✓ APPROVED. U5 ✓ CODE COMPLETE & APPROVED. U6 [Functional Design ✓ pending-approval] → NFR Req → NFR Design → Infra Design → Code Gen (the Terraform that makes it deployable).
- **U5 Verification**: 18 new tests pass (chat suite ~106); no type errors in any chat file; ESLint clean (mobile src + tests).
- **U5 REMAINING integration wiring** (documented in u5-code-summary.md; needs app auth/fetch providers): routes.ts/navigationTypes registration via wrapper screens; CHAT_MESSAGE deep-link; "Chat" buttons on activity cards. (SCREENS + WEBSOCKET_URL config done.)
- **U5 key finding/decision**: inbox needs a NEW backend endpoint `chatListChannels` (U1 has listChannelsForUser domain method but no REST handler) — proposed as a U5-owned backend addition. Mobile: ChatInbox/ChatRoom/ChatRoomHeader + useChatInbox/useChatRoom (WS client + AsyncStorage offline queue) + nav/deep-link + entry buttons.
- **U4 key finding**: CHAT_MESSAGE currently hits the generic else-branch (persists a notification record per message) → add a publish-only branch in NotificationService.sendPushNotification. History uses opaque base64 cursor; requesterId from Cognito sub.
- **U3 key decisions**: WebSocket Lambda authorizer (aws-jwt-verify, new dep) + userId persisted on connect (authorizer ctx not propagated → getConnectionUser); RealtimeNotifier via @aws-sdk/client-apigatewaymanagementapi (new dep); OfflineNotifier (push enqueue) lands in U3, U4 = history+OpenAPI+mobile deep-link (boundary refinement flagged).
- **U2 key finding**: lock trigger is the donation-REQUEST row → COMPLETED (acceptance row does not change on completion); lock fans out to all donor channels.
- **U1 Verification**: 48 chat tests passing (9 suites); ESLint clean; no chat type errors; fast-check installed.

## Execution Plan Summary
- **Stages to Execute**: Application Design, Units Generation, then per-unit Functional Design,
  NFR Requirements, NFR Design, Infrastructure Design, Code Generation; then Build and Test.
- **Stages to Skip**: none (complexity + Security/PBT extensions make all conditional stages valuable).
- **Proposed Units**: U1 Chat Core, U2 Channel Lifecycle (stream), U3 Real-time Messaging (WebSocket),
  U4 History+Push, U5 Mobile Client, U6 Infrastructure. Critical path U1→U3→U4→U5.
- **Plan**: aidlc-docs/inception/plans/execution-plan.md
- **Linked Issue**: https://github.com/CraftsmenLtd/BloodConnect/issues/571
- **Ticket Snapshot**: `issue-571.md` (repository root)

## Workspace State
- **Existing Code**: Yes
- **Programming Languages**: TypeScript (strict), Python 3, Java 17 (Android)
- **Build System**: npm workspaces + esbuild (Lambda), Vite (web), EAS (mobile), Terraform (IaC)
- **Project Structure**: Monorepo (core / clients / commons / openapi / iac / deployment)
- **Reverse Engineering Needed**: Yes (no prior artifacts)
- **Workspace Root**: /Users/sadekur/projects/craftsmen/BloodConnect

## Code Location Rules
- **Application Code**: Workspace root (NEVER in aidlc-docs/)
- **Documentation**: aidlc-docs/ only
- **Structure patterns**: See code-generation.md Critical Rules

## Extension Configuration
| Extension | Enabled | Mode | Decided At |
|---|---|---|---|
| Security Baseline | Yes | Full (all SECURITY-01..15 blocking) | Requirements Analysis (Q11=A) |
| Property-Based Testing | Yes | Full (all PBT-01..10 blocking; framework: fast-check) | Requirements Analysis (Q12=A) |

## Stage Progress

### 🔵 INCEPTION PHASE
- [x] Workspace Detection — Completed 2026-06-26
- [x] Reverse Engineering (feature-scoped) — Completed 2026-06-26 (approved)
  - **Artifacts Location**: aidlc-docs/inception/reverse-engineering/
- [x] Requirements Analysis — Completed 2026-06-26 (approved)
  - **Questions**: aidlc-docs/inception/requirements/requirement-verification-questions.md (answered)
  - **Requirements**: aidlc-docs/inception/requirements/requirements.md
- [x] User Stories — Completed 2026-06-26 (approved)
  - **Artifacts**: aidlc-docs/inception/user-stories/ (stories.md, personas.md); plan + assessment in inception/plans/
- [x] Workflow Planning — Completed 2026-06-26 (approved)
  - **Plan**: aidlc-docs/inception/plans/execution-plan.md
- [x] Application Design — Completed 2026-06-26 (approved)
  - **Artifacts**: aidlc-docs/inception/application-design/ (components, component-methods, services, component-dependency, application-design)
- [x] Units Generation — Completed 2026-06-26 (approved)
  - **Artifacts**: unit-of-work.md, unit-of-work-dependency.md, unit-of-work-story-map.md (in inception/application-design/)
  - **Units**: U1 Chat Core, U2 Channel Lifecycle, U3 Real-time Messaging, U4 History+Push, U5 Mobile, U6 Infra & Integration

### 🟢 CONSTRUCTION PHASE
- [~] Functional Design (per-unit) — EXECUTE
  - [x] U1 Chat Core — approved
  - [x] U2 Channel Lifecycle — complete (awaiting approval): aidlc-docs/construction/u2-channel-lifecycle/functional-design/
  - [ ] U3 / U4 / U5 / U6
- [~] NFR Requirements (per-unit) — EXECUTE
  - [x] U1 Chat Core — complete (awaiting approval): nfr-requirements.md, tech-stack-decisions.md (fast-check selected — PBT-09)
- [~] NFR Design (per-unit) — EXECUTE
  - [x] U1 Chat Core — complete (awaiting approval): nfr-design-patterns.md, logical-components.md
- [~] Infrastructure Design (per-unit) — EXECUTE
  - [x] U1 Chat Core — complete (awaiting approval): infrastructure-design.md, deployment-architecture.md; shared-infrastructure.md (SI-1 enable table TTL, SI-2 CHAT_MESSAGE)
- [~] Code Generation (per-unit) — EXECUTE (ALWAYS)
  - [x] U1 Chat Core — approved; 48 tests green. Summary: aidlc-docs/construction/u1-chat-core/code/u1-code-summary.md
  - [x] U2 Channel Lifecycle — approved; 13 tests green. Summary: aidlc-docs/construction/u2-channel-lifecycle/code/u2-code-summary.md
  - [x] U3 Real-time Messaging — approved; 25 tests green. Summary: aidlc-docs/construction/u3-realtime-messaging/code/u3-code-summary.md
  - [x] U4 History + Push — approved; 10 tests green. Summary: aidlc-docs/construction/u4-history-push/code/u4-code-summary.md
  - [x] U5 Mobile Client — approved (code complete); core tests green. Remaining nav/notification/entry-button wiring documented. Summary: aidlc-docs/construction/u5-mobile-client/code/u5-code-summary.md
  - [x] U6 Infrastructure & Integration — complete (awaiting approval): chat Terraform module (8 files) + modules.tf wiring + OpenAPI registration + REST integration VTL. Summary: aidlc-docs/construction/u6-infra-integration/code/u6-code-summary.md
- [x] Build and Test — Completed 2026-06-28 (awaiting approval): instructions in aidlc-docs/construction/build-and-test/; 106 chat tests pass

### 🟡 OPERATIONS PHASE
- [ ] Operations (placeholder)

## Skipped Stages Log
(none yet)
