# U2 Channel Lifecycle — NFR Design Patterns

| Pattern | Applied To | Realizes |
|---|---|---|
| **Idempotent Consumer** | Stream record processing (create via conditional put; lock via conditional update) | NFR-U2-R1, PBT-04 (safe at-least-once) |
| **Partial-Batch-Failure** (`ReportBatchItemFailures`) | Handler batch loop | NFR-U2-R2 (per-record retry, no batch blocking) |
| **Pure Core / Imperative Shell** | `classifyStreamItem` (pure) vs handler (AWS adapter) | NFR-U2-M1 (testable decision logic) |
| **Scatter (Fan-out) Lock** | onRequestCompleted → lock all donor channels | BR-U2-4 |
| **Tolerant Reader / Defensive Parsing** | Unmarshalling stream images; only read needed string attrs | NFR-U2-R3 (skip irrelevant/garbled records) |
| **Fail-Closed per-record** | try/catch around each record → mark for retry | NFR-U2-R3, SECURITY-15 |
| **Log Redaction** | structured logs; never log message bodies/PII | SECURITY-03 |

## Ordering & Convergence
- **create-then-lock**: normal path — OPEN channel then LOCKED.
- **lock-then-create** (out-of-order): lock targets a missing channel → logged no-op; a later create
  yields OPEN. Because the request is already COMPLETED, no messages are sent; a subsequent COMPLETED
  re-emission (or operational re-drive) re-locks. Acceptable convergence; documented as a known edge.
- **Recommendation (optional hardening, not in scope)**: on create, if the donation request is
  already COMPLETED, create the channel directly as LOCKED — fully closes the ordering gap. Deferred.

## Failure Semantics
- Transient errors (throttling, timeouts) → record returned in `batchItemFailures` for retry.
- Permanent/irrelevant records (no NewImage, unrelated keys) → skipped (not failures).

## Security Pattern Mapping
- SECURITY-15 (fail-closed + partial failure), SECURITY-03 (redacted logs),
  SECURITY-06 (least-privilege stream/table IAM → U2 Infra Design / U6).
