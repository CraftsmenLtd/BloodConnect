# Unit → Story Map — Issue #571 (In-app Chat)

Every story (US-1..US-14) is assigned to the unit(s) that deliver it. Some stories span a
backend unit + the mobile unit (the backend behavior and its UI live in different units) — these
are marked **(cross-unit)** with the primary owner first.

## By Unit
| Unit | Stories delivered |
|---|---|
| **U1 Chat Core** | *(enabler — no standalone story; underpins all)* |
| **U2 Channel Lifecycle** | US-1, US-2, US-3 |
| **U3 Real-time Messaging** | US-4, US-7, US-8 *(backend)*, US-9 *(unread compute)*, US-11, US-12 |
| **U4 History + Push** | US-5 *(history backend)*, US-10 *(push backend)* |
| **U5 Mobile Client** | US-5 *(UI)*, US-6, US-8 *(UI)*, US-9 *(badge UI)*, US-10 *(deep-link UI)*, US-13, US-14 |
| **U6 Infra & Integration** | *(enabler — provides WebSocket API/stream/IAM for US-1..US-12)* |

## By Story (coverage check — all 14 covered)
| Story | Primary unit | Also in |
|---|---|---|
| US-1 Auto-open on accept | U2 | U1 |
| US-2 Donor's chat on accept | U2 | U1, U5 |
| US-3 Lock on COMPLETED | U2 | U1 |
| US-4 Real-time text+emoji | U3 | U1, U5 |
| US-5 History newest-first | U4 (backend) | U5 (UI) |
| US-6 Offline queue | U5 | — |
| US-7 Typing indicator | U3 | U5 (UI) |
| US-8 Read receipts | U3 (backend) | U5 (UI) |
| US-9 Unread badge | U3 (compute) | U5 (badge UI) |
| US-10 Push deep-link | U4 (backend) | U5 (deep-link), U6 |
| US-11 Participant-only (403) | U3 | U6 (authorizer infra) |
| US-12 Anti-flood throttle | U3 | — |
| US-13 Seeker "Chat" button | U5 | — |
| US-14 Donor "Chat" button | U5 | — |

## Notes
- **U1** and **U6** are enabling units (contracts and infrastructure). They carry no standalone
  user story but are prerequisites for the delivering units; their acceptance is validated through
  the stories of dependent units plus their own unit/integration tests.
- **Cross-unit stories** (US-5, US-8, US-9, US-10) require both the backend unit and U5 to be
  complete for full end-to-end acceptance; tracked at the integration checkpoints in
  `unit-of-work-dependency.md`.
