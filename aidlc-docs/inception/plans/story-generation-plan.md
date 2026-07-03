# Story Generation Plan — Issue #571 (In-app Chat)

> **Note on answers**: Per the user's standing instruction *"for further questions, add your
> recommendation"*, the planning questions below are pre-filled with recommended choices instead
> of being left as a blocking gate. The user can override any choice during the User Stories
> review gate.

## Planning Decisions (recommended, pre-filled)

### Q-A — User personas to model
A) Seeker + Donor only
B) Seeker + Donor + Platform/Admin
X) Other

[Answer]: A — Seeker and Donor are the only direct chat participants this iteration (mobile only,
no admin/dashboard chat per requirements Q9).

### Q-B — Story breakdown approach
A) User Journey-Based
B) Feature-Based
C) Persona-Based
D) Hybrid (Persona + Journey, grouped into epics)
X) Other

[Answer]: D — Hybrid: group stories into epics (Channel Lifecycle, Messaging, Awareness &
Notifications, Access & Safety), each story written from a persona's point of view.

### Q-C — Acceptance-criteria format
A) Given/When/Then (Gherkin-style)
B) Bullet checklist
X) Other

[Answer]: A — Given/When/Then; testable and maps cleanly to PBT/example-based tests later.

### Q-D — Story granularity
A) Coarse (epic-level)
B) Medium (one story per user-visible capability)
C) Fine (sub-task level)
X) Other

[Answer]: B — One story per user-visible capability; INVEST-sized.

### Q-E — Include non-functional/security as stories?
A) Yes — model access-control, rate-limit, retention as their own stories
B) No — keep NFRs only in requirements.md
X) Other

[Answer]: A — Model the user-observable security/safety behaviors (privacy, anti-flood) as stories
so they get acceptance criteria; pure infra NFRs stay in requirements.md.

## Execution Checklist (Part 2 — Generation)
- [x] Generate personas.md with Seeker and Donor archetypes
- [x] Generate stories.md with INVEST stories grouped into 4 epics
- [x] Write Given/When/Then acceptance criteria for each story
- [x] Map each story to requirements (FR/NFR) and to personas
- [x] Include the deliberate IGNORED-channel deviation as an explicit story note
- [x] Ensure stories are Independent, Negotiable, Valuable, Estimable, Small, Testable
