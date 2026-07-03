# U1 Chat Core — Infrastructure Design

> Maps U1 logical components to infrastructure. U1 is data+domain, so its only infra change is
> **enabling TTL** on the shared DynamoDB table; compute/network are reused or deferred.

## Storage — DynamoDB (reuse shared table)
- **Table**: `${var.environment}-bloodConnect-table` (`PAY_PER_REQUEST`, `PK`/`SK`).
- **Indexes**: existing **GSI1** (`GSI1PK`/`GSI1SK`, projection `ALL`) is sufficient for chat
  membership (inbox) and connection-by-user access patterns — **no new GSI/LSI**.
- **Streams**: already `NEW_AND_OLD_IMAGES` (consumed by U2 stream consumer).
- **Encryption at rest (SECURITY-01)**: ✅ DynamoDB default at-rest encryption (AWS-owned key).
  CMK intentionally not used (existing `checkov:skip=CKV_AWS_119`); upgrade is out of chat scope.
- **TTL (REQUIRED CHANGE — NFR-2 / BR-10)**: table currently has **no `ttl` block**. Add:
  ```hcl
  ttl {
    attribute_name = "ttl"
    enabled        = true
  }
  ```
  Safe for existing entities (TTL only expires items that carry a `ttl` attribute). Detailed in
  `shared-infrastructure.md`.

## Compute / Messaging / Networking
- **None at U1.** Lambda handlers, WebSocket API, stream event-source mapping, and SQS reuse are
  introduced in U2 (stream), U3 (WebSocket), U4 (history/push), U6 (consolidated infra + IAM).

## IAM (action set required by chat persistence — authored downstream)
- On the table ARN and its `GSI1` index ARN, least-privilege (SECURITY-06):
  `dynamodb:GetItem`, `PutItem`, `UpdateItem`, `DeleteItem`, `Query`, `TransactWriteItems`.
- Split read vs write statements; scope to the specific table/index ARNs (no wildcards).
- Concrete per-Lambda policies created in U2/U3/U4 and consolidated/verified in U6.

## In-transit encryption (SECURITY-01)
- All access via AWS SDK over TLS (DynamoDB endpoints enforce TLS). WebSocket WSS / REST HTTPS are
  configured in U3/U6.

## Security mapping (this stage)
- SECURITY-01 ✅ at-rest (default) + in-transit (TLS). SECURITY-06 → IAM action set documented
  (enforced in U6). SECURITY-02/14 (access logs, retention/alerts) → U6.
