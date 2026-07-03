# U2 Channel Lifecycle — NFR Requirements

## Performance
- **NFR-U2-P1**: Per-record work is bounded — create = 1 request read + 1 transactional write;
  lock = 1 acceptance query + N small channel updates (N = accepted donors, typically ≤ a few).
- **NFR-U2-P2**: Stream batch size configurable (default 10); processing is async, not user-facing.

## Scalability
- **NFR-U2-S1**: Scales with the existing DynamoDB stream shards; no new datastore.
- **NFR-U2-S2**: Lock fan-out bounded by donors-per-request (small); no unbounded loops.

## Reliability / Availability
- **NFR-U2-R1**: Idempotent create + conditional lock ⇒ safe under at-least-once stream delivery and
  retries (PBT-04).
- **NFR-U2-R2**: Partial-batch-failure reporting (`ReportBatchItemFailures`) — only failed records
  are retried; one bad record does not block the batch.
- **NFR-U2-R3**: Fail-closed per-record error handling; `lockChannel` on a missing channel is a
  logged no-op (tolerates lock-before-create ordering).

## Security (extension)
- **NFR-U2-SEC1 (SECURITY-06)**: Least-privilege IAM — stream read + scoped table/GSI1 actions only.
- **NFR-U2-SEC2 (SECURITY-03)**: Structured logs with correlation context; **no PII / message
  content** (this unit never reads message bodies).
- **NFR-U2-SEC3 (SECURITY-15)**: Fail-closed; global handler; generic errors.

## Maintainability / Testability
- **NFR-U2-M1**: Pure `classifyStreamItem` + AWS-agnostic `ChannelLifecycleService` keep the
  decision logic unit-testable; the handler is a thin adapter.
- **NFR-U2-M2 (PBT)**: fast-check for the classifier (total/deterministic) + idempotence; example
  tests for create/lock/fan-out/partial-failure. ≥ 60% function coverage.

## Out of scope for U2 (elsewhere)
- WebSocket/messaging (U3), history/push (U4), IAM + stream event-source mapping Terraform (U2 Infra
  Design declares; U6 consolidates).
