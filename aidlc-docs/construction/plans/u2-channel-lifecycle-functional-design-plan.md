# U2 Channel Lifecycle — Functional Design Plan

> Answers pre-filled with recommendations per the user's standing instruction.

### Q-1 — What stream events trigger channel CREATION?
[Answer]: INSERT/MODIFY of an **acceptance** row (`PK begins_with BLOOD_REQ#`, `SK begins_with ACCEPTED#`)
whose `NewImage.status == ACCEPTED` → `createChannelIfAbsent`. (Idempotent; replays are safe.)

### Q-2 — What triggers channel LOCKING? (CODE-GROUNDED CORRECTION)
[Answer]: Verified `completeDonationRequest` updates the **donation-request** row to
`DonationStatus.COMPLETED` and does **not** change the acceptance row. Therefore lock on **MODIFY of
the donation-request row** (`SK begins_with BLOOD_REQ#`) where `NewImage.status == COMPLETED`. Because
a request may have multiple accepted donors (multiple channels), the consumer **fans out**: list the
request's accepted donors and `lockChannel` for each `${requestPostId}#${donorId}`.

### Q-3 — IGNORED / CANCELLED / EXPIRED handling
[Answer]: IGNORED → **no-op** (channel stays OPEN per requirements Q6=C). CANCELLED / EXPIRED → out of
the agreed scope (Q6 said "COMPLETED only"); **recommendation**: treat them like COMPLETED (lock) in a
follow-up, since the request is no longer actionable. For this iteration: **no-op** to honor Q6=C.

### Q-4 — How is channel context (blood group/urgency/date/location) obtained?
[Answer]: The acceptance NewImage carries `status` + `createdAt` (= request createdAt) + keys. Fetch the
request via `BloodDonationService.getDonationRequest(seekerId, requestPostId, createdAt)` to build the
immutable `ChatChannelContext` snapshot.

### Q-5 — Where does the orchestration logic live?
[Answer]: A new AWS-agnostic `ChannelLifecycleService` (in `core/application/chatWorkflow`) holds the
decision + orchestration (testable). The Lambda handler (U2 Code Gen) parses the DynamoDB stream
records and delegates. A pure `classifyStreamItem` mapper enables PBT.

### Q-6 — Failure handling
[Answer]: Per-record try/catch; on error, add to `batchItemFailures` (partial-batch-failure, mirrors
`sendPushNotification`); fail-closed (SECURITY-15). Unparseable/irrelevant records are skipped.

## Checklist
- [x] business-logic-model.md
- [x] business-rules.md
- [x] domain-entities.md (no new persisted entities; documents consumed stream record shapes)
