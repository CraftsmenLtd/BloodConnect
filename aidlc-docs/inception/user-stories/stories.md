# User Stories — Issue #571 (In-app Chat)

**Format**: Given/When/Then acceptance criteria. **Personas**: Sadia (Seeker), Rahim (Donor).
Each story notes the requirement(s) it traces to and is sized to be INVEST-compliant.

---

## Epic A — Channel Lifecycle

### US-1 — Chat opens automatically when a donor accepts (Seeker)
**As** Sadia (seeker), **I want** a chat to open automatically as soon as a donor accepts my
request, **so that** I can coordinate without sharing or dialing a phone number.
- **Given** my blood request has an eligible donor,
  **When** that donor's acceptance is recorded (`AcceptDonationStatus = ACCEPTED`),
  **Then** a chat channel for `(seekerId, requestPostId, donorId)` is created with status `OPEN`
  and appears in my Chat Inbox.
- **Given** the acceptance event is delivered more than once,
  **When** the system processes it again,
  **Then** no duplicate channel is created (idempotent).
- *Traces*: FR-1. *Persona*: Sadia.

### US-2 — Donor gets a chat on acceptance (Donor)
**As** Rahim (donor), **I want** a chat with the seeker right after I accept, **so that** I can
arrange the donation details.
- **Given** I accept a request,
  **When** the acceptance succeeds,
  **Then** an `OPEN` chat with the seeker is available from my active donation card.
- *Traces*: FR-1, FR-5. *Persona*: Rahim.

### US-3 — Chat locks when the donation completes (Both)
**As** a participant, **I want** the chat to become read-only once the donation is completed,
**so that** the thread is preserved but no longer active.
- **Given** an `OPEN` channel,
  **When** `AcceptDonationStatus` for that triplet transitions to `COMPLETED`,
  **Then** the channel status becomes `LOCKED`, new messages are rejected, and history stays
  readable.
- **Given** a `LOCKED` channel,
  **When** I open it,
  **Then** I see the banner *"This chat is closed as the donation request is complete."*
- **Note / deviation**: On `IGNORED`, the channel **remains OPEN** until 90-day TTL purge (decision
  Q6=C) — it is **not** locked. This intentionally differs from the ticket's original AC.
- *Traces*: FR-7. *Persona*: Sadia, Rahim.

---

## Epic B — Messaging

### US-4 — Send and receive messages in real time (Both)
**As** a participant, **I want** to send and receive text (with emoji) instantly, **so that** we
can coordinate live.
- **Given** an `OPEN` channel and both of us connected,
  **When** I send a message,
  **Then** the other participant receives it in real time over the WebSocket and it is persisted.
- **Given** a message longer than the allowed limit (2000 chars) or non-text content,
  **When** I try to send it,
  **Then** it is rejected with a validation error.
- *Traces*: FR-3 (text+emoji), NFR-1 (SECURITY-05). *Persona*: Sadia, Rahim.

### US-5 — View message history newest-first (Both)
**As** a participant, **I want** to see prior messages when I open a chat, **so that** I have the
full coordination record.
- **Given** a channel with messages,
  **When** I open the room,
  **Then** I see messages paginated newest-first (page size 20) and can load older pages.
- *Traces*: FR-4. *Persona*: Sadia.

### US-6 — Offline messages are queued and delivered on reconnect (Donor)
**As** Rahim (donor), **I want** messages I compose while offline to send automatically when I
reconnect, **so that** poor signal doesn't lose my coordination.
- **Given** I am offline,
  **When** I compose and send a message,
  **Then** it is queued locally with a `clientMessageId`.
- **Given** I reconnect,
  **When** the queue flushes,
  **Then** each message is delivered exactly once (no duplicates) and in order.
- *Traces*: FR-6. *Persona*: Rahim.

---

## Epic C — Awareness & Notifications

### US-7 — Typing indicator (Both)
**As** a participant, **I want** to see when the other person is typing, **so that** I know a reply
is coming.
- **Given** an `OPEN` channel with both connected,
  **When** the other participant is typing,
  **Then** I see a transient "typing…" indicator that disappears when they stop or send.
- **And** typing state is ephemeral (not stored).
- *Traces*: FR-9 (typing). *Persona*: Sadia, Rahim.

### US-8 — Delivered/read receipts (Seeker)
**As** Sadia (seeker), **I want** to know when my message was delivered and read, **so that** I
know the donor is aware.
- **Given** I sent a message,
  **When** it reaches the donor's device / the donor opens the room,
  **Then** I see a delivered / read indicator, derived from the donor's `lastReadAt`.
- *Traces*: FR-9 (receipts). *Persona*: Sadia.

### US-9 — Unread count badge in the inbox (Seeker)
**As** Sadia (seeker), **I want** an unread badge on each chat, **so that** I can see which
conversations need my attention.
- **Given** unread messages after my `lastReadAt`,
  **When** I view the Chat Inbox,
  **Then** each channel shows the latest message preview and an unread count (never negative).
- *Traces*: FR-5, FR-9. *Persona*: Sadia.

### US-10 — Push notification deep-links to the room (Both)
**As** a participant who isn't currently connected, **I want** a push notification when I get a
message, **so that** I don't miss coordination.
- **Given** I am not connected via WebSocket,
  **When** the other participant sends a message,
  **Then** I receive a `CHAT_MESSAGE` push that, when tapped, opens the correct `ChatRoom`.
- *Traces*: FR-8. *Persona*: Sadia, Rahim.

---

## Epic D — Access & Safety

### US-11 — Only the two participants can access the channel (Both)
**As** a participant, **I want** my chat to be private to me and the other party, **so that** no
one else can read or post.
- **Given** a channel for `(seekerId, requestPostId, donorId)`,
  **When** anyone who is not that seeker or donor tries to connect, read history, or send,
  **Then** the request is rejected with `403`.
- **Given** an unauthenticated WebSocket connection attempt,
  **When** it reaches `$connect`,
  **Then** it is rejected (no `connectionId` stored).
- *Traces*: FR-2, NFR-1 (SECURITY-08). *Persona*: Sadia, Rahim.

### US-12 — Protection from message flooding (Donor)
**As** a participant, **I want** the chat to stay usable even if someone sends messages rapidly,
**so that** the conversation isn't disrupted by abuse.
- **Given** an `OPEN` channel,
  **When** a participant exceeds 60 messages/minute,
  **Then** further sends are throttled with a clear error until the window resets.
- *Traces*: FR-3, NFR-3 (SECURITY-11). *Persona*: Rahim.

---

## Epic E — Entry Points (Navigation)

### US-13 — "Chat" button on the seeker's accepted-donor card (Seeker)
**As** Sadia (seeker), **I want** a "Chat" button on each accepted donor in
`MyActivity → donorTracking`, **so that** I can jump straight into the conversation.
- **Given** an accepted donor on my request,
  **When** I view donor tracking,
  **Then** a "Chat" button opens that donor's `ChatRoom`.
- *Traces*: FR-5. *Persona*: Sadia.

### US-14 — "Chat" button on the donor's active donation card (Donor)
**As** Rahim (donor), **I want** a "Chat" button on my active donation card in `MyActivity`,
**so that** I can reach the seeker quickly.
- **Given** I have an active accepted donation,
  **When** I view MyActivity,
  **Then** a "Chat" button opens the seeker's `ChatRoom`.
- *Traces*: FR-5. *Persona*: Rahim.

---

## Persona → Story Map
| Persona | Stories |
|---|---|
| Sadia (Seeker) | US-1, US-3, US-4, US-5, US-8, US-9, US-10, US-11, US-13 |
| Rahim (Donor) | US-2, US-3, US-4, US-6, US-7, US-10, US-11, US-12, US-14 |

## Story → Requirement Traceability
| Story | Requirements |
|---|---|
| US-1, US-2 | FR-1 |
| US-3 | FR-7 |
| US-4 | FR-3, NFR-1 |
| US-5 | FR-4 |
| US-6 | FR-6 |
| US-7, US-8 | FR-9 |
| US-9 | FR-5, FR-9 |
| US-10 | FR-8 |
| US-11 | FR-2, NFR-1 |
| US-12 | FR-3, NFR-3 |
| US-13, US-14 | FR-5 |

## INVEST Check (summary)
- **Independent**: stories are separable; messaging (B) does not require awareness (C) to ship.
- **Negotiable / Valuable**: each delivers user-visible value to a named persona.
- **Estimable / Small**: each maps to a bounded capability (one screen/handler/behavior).
- **Testable**: every story has Given/When/Then criteria suitable for example-based + property tests.
