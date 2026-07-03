# U1 Chat Core — Infrastructure Design Plan

> Answers pre-filled with recommendations per the user's standing instruction. Grounded in the
> actual `iac/terraform/aws/dynamodb/dynamodb.tf`.

### Q-1 — Storage: new table or reuse?
[Answer]: Reuse the existing shared single table (`{env}-bloodConnect-table`). Chat entities use new
key prefixes; **GSI1 (projection ALL) already exists** and is sufficient for membership/connection
access patterns. **No new table or index.**

### Q-2 — TTL (90-day retention)
A) Table already has TTL — reuse
B) **Table has NO `ttl` block — must enable TTL** (`attribute_name = "ttl"`, `enabled = true`)
[Answer]: B — verified: `dynamodb.tf` has no `ttl` block. Enabling it is required for NFR-2/BR-10.
Safe: TTL only deletes items that carry the `ttl` attribute, so existing entities are unaffected.
This is a **shared-infrastructure change** (see shared-infrastructure.md).

### Q-3 — Encryption at rest (SECURITY-01)
[Answer]: Satisfied by DynamoDB **default at-rest encryption (AWS-owned key)**. CMK is intentionally
not used (existing documented `checkov:skip=CKV_AWS_119`). No change for chat; CMK upgrade is an
existing, out-of-scope decision.

### Q-4 — Compute / messaging / networking for U1
[Answer]: None at U1. U1 is data+domain; Lambdas/WebSocket/stream/SQS belong to U2/U3/U4/U6.

### Q-5 — IAM
[Answer]: Chat Lambdas (U2/U3/U4) need scoped table actions: GetItem/PutItem/UpdateItem/DeleteItem/
Query/TransactWriteItems on the table + GSI1 ARN, least-privilege (SECURITY-06). Authored per-Lambda
in their units / consolidated in U6. U1 documents the required action set.

### Q-6 — Environments
[Answer]: Both LocalStack and AWS (ap-south-1); TTL block applies to both module instances.

## Checklist
- [x] infrastructure-design.md
- [x] deployment-architecture.md
- [x] shared-infrastructure.md (TTL enablement on shared table)
