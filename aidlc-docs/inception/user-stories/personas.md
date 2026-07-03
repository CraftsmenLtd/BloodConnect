# Personas — Issue #571 (In-app Chat)

## Persona 1: Sadia — the Seeker
- **Role**: Person (or relative) who needs blood urgently and posts a request.
- **Context**: Stressed, time-pressured, often coordinating from a hospital. Uses the mobile app.
- **Goals**:
  - Reach an accepting donor quickly and confirm logistics (when/where).
  - Keep a record of what was agreed, in one place.
- **Frustrations (today)**:
  - Must call/SMS a stranger; the donor's phone number is exposed; no in-app record.
  - Can't tell whether the donor saw the message.
- **What chat gives her**: An automatic, private thread per accepted donor with the request
  context at the top, real-time replies, read receipts, and a push when the donor messages.
- **Key stories**: US-1, US-5, US-8, US-9, US-10, US-11, US-13.

## Persona 2: Rahim — the Donor
- **Role**: Eligible donor who accepts a nearby request.
- **Context**: On the move; may have intermittent connectivity; wants low-friction coordination.
- **Goals**:
  - Confirm details with the seeker and arrange the donation without sharing personal contact.
  - Send a quick message even if signal drops, and have it delivered later.
- **Frustrations (today)**:
  - Phone number gets shared; coordination happens off-platform.
- **What chat gives him**: A "Chat" button on his active donation card, real-time + offline-queued
  messaging, typing/read awareness, and a clear read-only state once the donation is complete.
- **Key stories**: US-2, US-4, US-6, US-7, US-12, US-14.

## Persona Notes
- Both personas are **participants** of exactly one channel per `(seekerId, requestPostId, donorId)`
  triplet. There is no group chat and no third-party (admin) participant this iteration.
- Privacy expectation is mutual: neither persona's messages should be visible to anyone outside
  their channel (drives US-11 / SECURITY-08).
