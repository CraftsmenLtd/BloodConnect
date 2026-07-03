# U1 Chat Core — NFR Requirements

## Performance
- **NFR-P1**: Domain operations are O(1) single-item or O(page=20); p99 domain-logic latency < 50 ms
  (excluding DynamoDB/network).
- **NFR-P2**: History pagination fixed at 20 items/page (cursor-based) to bound read cost.
- **NFR-P3**: Send path performs a bounded write set (1 message + 1 dedup + 2 membership updates +
  1 rate ADD) — documented write amplification, acceptable at expected volume.

## Scalability
- **NFR-S1**: DynamoDB `PAY_PER_REQUEST` scales automatically; no provisioned capacity to tune.
- **NFR-S2**: Partition strategy avoids global hot keys — message partition is per `channelId`;
  inbox/connection fan-out partitioned per `userId`. Worst case (one extremely active channel) is
  bounded by the 60/min rate limit.

## Availability / Reliability
- **NFR-A1**: Stateless domain + Lambda; DynamoDB multi-AZ; no in-unit single point of failure.
- **NFR-R1**: Idempotent channel creation (conditional put) and exactly-once message dedup make
  retries safe (PBT-04).
- **NFR-R2**: Fail-closed error handling on all persistence calls (SECURITY-15); errors are typed
  (NotFound/Forbidden/Conflict/Throttling) and mapped to safe client responses.
- **NFR-R3**: Self-healing connection registry (delete on `GoneException`).

## Security (extension — applicable subset at U1 layer)
- **NFR-SEC1 (SECURITY-05)**: All inputs validated (id allowlist + bounded length; body ≤ 2000,
  text/emoji only) before any key construction or persistence.
- **NFR-SEC2 (SECURITY-08)**: Participant authorization (`assertParticipant`) is mandatory on every
  channel/message access; no IDOR.
- **NFR-SEC3 (SECURITY-11)**: Per-`(channel,sender)` rate limiting; chat-authz logic isolated in
  services.
- **NFR-SEC4 (SECURITY-15)**: Fail-closed; global handler at adapter entry; no PII/body/token logged
  (SECURITY-03).
- **NFR-SEC5 (SECURITY-01)**: Data at rest encrypted (shared table already encrypted); enforced/verified
  in Infrastructure Design.

## Maintainability / Testability
- **NFR-M1**: Hexagonal — domain depends only on ports; AWS SDK confined to adapters.
- **NFR-M2**: ≥ 60% function coverage (repo floor); chat core targets higher given criticality.
- **NFR-M3 (PBT)**: fast-check property tests for the catalogued properties (round-trip, invariant,
  idempotence, stateful) **alongside** example-based tests (PBT-10); shrinking enabled, seed logged
  (PBT-08).
- **NFR-M4**: TS strict, no `any`, single quotes/no semicolons/150-col (ESLint).

## Out of scope for U1 (handled elsewhere)
- WebSocket transport tuning, API Gateway logging (U3/U6).
- IAM least-privilege policies (U6 / Infrastructure Design).
- Log retention + alerting config (U6 — SECURITY-02/14).
