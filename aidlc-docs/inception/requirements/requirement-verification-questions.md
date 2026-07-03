# Requirements Verification Questions — Issue #571 (In-app Chat)

The ticket is detailed, but several decisions affect scope, architecture, and effort. Please
answer each question by filling the letter after the `[Answer]:` tag. If none fit, choose the
**Other** option and describe your preference. Let me know when you're done.

## Intent Analysis (for your reference — no answer needed)
- **Request type**: New Feature (large, cross-cutting)
- **Scope**: Multiple components (backend Lambdas + DynamoDB + WebSocket IaC + mobile client + OpenAPI)
- **Complexity**: Complex (real-time, new infra, new domain workflow)
- **Depth selected**: Comprehensive

---

## Question 1 — Delivery scope for THIS iteration
The ticket bundles backend, mobile, and non-functional work. How should we scope what we build now?

A) Full feature in one go — all backend + mobile + NFR acceptance criteria
B) Backend-first MVP — WebSocket + channel creation + send/history + push, defer mobile UI to a follow-up
C) Thin end-to-end MVP — text-only chat, channel auto-create on ACCEPTED, send/receive + history + minimal mobile screens; defer offline-queue, unread badges, rate-limiting to a follow-up
D) Mobile-first — wire UI against a mocked/stub backend first
X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 2 — Real-time transport
The ticket specifies an API Gateway **WebSocket** API. Confirm the transport.

A) API Gateway WebSocket API (as specified in the ticket)
B) Polling / long-polling over existing REST (simpler infra, not truly real-time)
C) Third-party (e.g., AWS AppSync subscriptions / Pusher / Ably)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 3 — Message content types (initial release)
What can a message contain initially?

A) Plain text only
B) Text + emoji
C) Text + image attachments (S3-backed)
D) Text + images + location/structured "donation info" cards
X) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 4 — Existing phone-number exposure
Today the seeker's "Donor Found" notification includes the donor's name and phone number. Once
chat exists, what happens to that?

A) Keep phone number in the notification AND add chat (chat is additive)
B) Keep phone number for now; revisit removal in a later ticket
C) Remove phone number from the notification; coordination moves to chat
X) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 5 — Channel creation trigger mechanism
The ticket suggests a `chatChannelCreator` Lambda on the DynamoDB stream. Confirm the mechanism.

A) DynamoDB stream consumer (decoupled, as the ticket describes)
B) Create the channel synchronously inside `AcceptDonationService` (simpler, no stream consumer)
C) Either is fine — pick whichever is cleaner during design
X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 6 — Chat lifecycle on COMPLETED / IGNORED
The ticket says lock the channel on `COMPLETED`/`IGNORED`. For `IGNORED`, the acceptance record
is currently **deleted**. What should happen to the chat?

A) Lock (read-only) on COMPLETED; lock on IGNORED too (history preserved, read-only)
B) Lock on COMPLETED; fully delete/archive the channel on IGNORED
C) Lock on COMPLETED only; leave IGNORED channels open until TTL
X) Other (please describe after [Answer]: tag below)

[Answer]: C

## Question 7 — History retention & rate limiting (NFR)
The ticket proposes 90-day TTL retention and ~60 msg/min rate limiting. Include both now?

A) Yes — implement 90-day TTL and 60 msg/min rate limiting in this iteration
B) TTL now, defer rate limiting to a follow-up
C) Neither now — defer both to a hardening follow-up
X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 8 — Presence / typing / receipts
Beyond the ticket's "unread count" badge, which real-time niceties are in scope now?

A) None — just message send/receive + unread count
B) Add "delivered/read" receipts
C) Add typing indicators
D) Add both receipts and typing indicators
X) Other (please describe after [Answer]: tag below)

[Answer]: D

## Question 9 — Client platforms in scope
Which clients get chat in this iteration?

A) Mobile (React Native/Expo) only
B) Mobile + organization web dashboard
C) Mobile + organization + monitoring dashboards
X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 10 — Target environment for build & validation
Where should generated code be buildable/testable in this iteration?

A) LocalStack local dev (matches existing `make start-dev` flow)
B) Real AWS (ap-south-1) deployment
C) Both — LocalStack for dev, Terraform ready for AWS
X) Other (please describe after [Answer]: tag below)

[Answer]: C

---

## Question 11 — Security Extensions (extension opt-in)
Should security extension rules be enforced for this project?

A) Yes — enforce all SECURITY rules as blocking constraints (recommended for production-grade applications)
B) No — skip all SECURITY rules (suitable for PoCs, prototypes, and experimental projects)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 12 — Property-Based Testing Extension (extension opt-in)
Should property-based testing (PBT) rules be enforced for this project?

A) Yes — enforce all PBT rules as blocking constraints (recommended for projects with business logic, data transformations, serialization, or stateful components)
B) Partial — enforce PBT rules only for pure functions and serialization round-trips (suitable for projects with limited algorithmic complexity)
C) No — skip all PBT rules (suitable for simple CRUD applications, UI-only projects, or thin integration layers with no significant business logic)
X) Other (please describe after [Answer]: tag below)

[Answer]: A
