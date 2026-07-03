# Unit of Work Plan — Issue #571 (In-app Chat)

> **Note on answers**: Pre-filled with recommendations per the user's standing instruction.
> Overridable at the Units Generation review gate.

## Decomposition Decisions (recommended, pre-filled)

### Q-1 — Unit granularity
A) 1–2 big units (backend + mobile)
B) 6 cohesive units: U1 Chat Core, U2 Channel Lifecycle, U3 Real-time Messaging, U4 History+Push,
   U5 Mobile Client, U6 Infrastructure & Integration
X) Other

[Answer]: B — matches the execution plan; each unit is independently designable/testable with clear
dependencies.

### Q-2 — Deployment model / nature of a "unit"
A) Each unit = independently deployable microservice
B) Units = logical work packages (modules) within the existing npm monorepo; new Lambdas deploy via
   the existing Terraform/esbuild pipeline
X) Other

[Answer]: B — BloodConnect is a monorepo of Lambdas + clients; units are work packages, not new
services.

### Q-3 — Build/update sequence
A) Strictly sequential U1→U6
B) U1 first (foundation); then U2 and U3 in parallel; then U4; then U5; U6 (infra) authored
   alongside U2/U3 and finalized before Build & Test
X) Other

[Answer]: B — respects the critical path U1→U3→U4→U5 while allowing parallelism.

### Q-4 — Mobile decomposition
A) Split mobile into separate Inbox vs Room units
B) Keep mobile as one cohesive unit (U5)
X) Other

[Answer]: B — shared hooks/navigation/state make a single mobile unit cleaner.

### Q-5 — Infrastructure placement
A) Author all infra inside each unit's Infrastructure Design only
B) Author infra per-unit in Infrastructure Design AND keep a thin U6 to consolidate WebSocket API,
   stream mapping, IAM, LocalStack parity, and end-to-end wiring
X) Other

[Answer]: B — keeps cross-cutting infra coherent and gives a single integration checkpoint.

## Execution Checklist (artifact generation)
- [x] Generate unit-of-work.md (unit definitions, responsibilities, scope, deliverables)
- [x] Generate unit-of-work-dependency.md (dependency matrix + sequence)
- [x] Generate unit-of-work-story-map.md (every story assigned; cross-unit stories noted)
- [x] Validate unit boundaries; ensure all 14 stories covered
- [x] Confirm each unit carries its Security + PBT obligations into CONSTRUCTION
