# U2 Channel Lifecycle — Business Rules

| ID | Rule | Trace |
|---|---|---|
| **BR-U2-1** | A channel is created only from an **acceptance** row (`SK begins_with ACCEPTED#`) whose `status == ACCEPTED`. | FR-1, US-1/US-2 |
| **BR-U2-2** | Channel creation is idempotent — replayed/duplicate stream events never create a second channel. | PBT-04 |
| **BR-U2-3** | Channels lock from a **donation-request** row (`SK begins_with BLOOD_REQ#`) transitioning to `DonationStatus.COMPLETED` (the acceptance row does not change on completion). | FR-7, US-3 (code-grounded) |
| **BR-U2-4** | On request completion, **all** accepted-donor channels for that `(seekerId, requestPostId)` are locked (fan-out). | FR-7 |
| **BR-U2-5** | `IGNORED` acceptance changes and `REMOVE` events are no-ops — the channel stays OPEN until TTL (Q6=C). | Q6=C |
| **BR-U2-6** | CANCELLED / EXPIRED request statuses are **no-ops** this iteration (out of agreed scope); recommended to lock in a follow-up. | scope note |
| **BR-U2-7** | The channel `context` snapshot is sourced from the donation request at creation time and is immutable thereafter. | BR-11 (U1) |
| **BR-U2-8** | Each stream record is processed in isolation; a failure marks only that record for retry (partial-batch-failure); processing is fail-closed. | NFR-R2, SECURITY-15 |
| **BR-U2-9** | `lockChannel` on a non-existent channel is a logged no-op (tolerates lock-before-create ordering). | NFR-R1 |

## Testable Properties (PBT-01)
- **Invariant/total mapping (PBT-03)**: `classifyStreamItem` returns exactly one of
  `CREATE_CHANNEL | LOCK_REQUEST_CHANNELS | NOOP` for every input; only ACCEPTED acceptance rows map
  to CREATE; only COMPLETED request rows map to LOCK.
- **Idempotence (PBT-04)**: applying the same ACCEPTED event twice ⇒ one `createChannelIfAbsent` net
  effect; applying COMPLETED twice ⇒ lock remains LOCKED.
- **Key parsing round-trip (PBT-02)**: derive `(seekerId, requestPostId, donorId)` from
  `(PK, SK)` and rebuild the same keys.

## Security mapping
- SECURITY-15 (fail-closed, partial-batch-failure), SECURITY-03 (no PII in logs),
  SECURITY-06 (stream-consumer IAM least-privilege → U6 / U2 Infra Design).
