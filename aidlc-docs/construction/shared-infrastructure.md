# Shared Infrastructure Changes — Issue #571 (In-app Chat)

Cross-cutting infrastructure changes that affect shared modules (not owned by a single unit).
Authored here, implemented during Code Generation and consolidated/verified in **U6**.

## SI-1: Enable DynamoDB TTL on the shared table (from U1)
- **Module**: `iac/terraform/aws/dynamodb/dynamodb.tf` (and the LocalStack equivalent).
- **Change**: add a `ttl` block to `aws_dynamodb_table.blood_connect_data`:
  ```hcl
  ttl {
    attribute_name = "ttl"
    enabled        = true
  }
  ```
- **Why**: chat channels/messages require 90-day auto-expiry; connections (~2h) and rate counters
  (~2min) also rely on TTL (NFR-2, BR-10).
- **Blast radius**: **safe** — DynamoDB TTL only deletes items that carry the numeric `ttl`
  attribute. Existing entities (users, requests, acceptances, notifications, donor-search) do not
  set `ttl`, so they are unaffected.
- **Owner / sequencing**: declared by U1; applied as part of U6 (or whenever the first chat
  Terraform lands). Must be applied before chat goes live so retention behaves as specified.

## SI-2: NotificationType.CHAT_MESSAGE (from U1/U4)
- **Module**: `commons/dto/NotificationDTO.ts` (shared DTO, not infra, but cross-cutting).
- **Change**: add `CHAT_MESSAGE = 'CHAT_MESSAGE'` to the `NotificationType` enum.
- **Blast radius**: additive enum value; existing consumers unaffected.

## Future shared infra (declared by later units, listed for visibility)
- **SI-3 (U3/U6)**: API Gateway **WebSocket** API + routes + Lambda authorizer + WSS.
- **SI-4 (U2/U6)**: DynamoDB **stream event-source mapping** → `chatChannelCreator`.
- **SI-5 (U4)**: reuse existing SQS push queue + `send-push-notification` + SNS for `CHAT_MESSAGE`.
- **SI-6 (U6)**: least-privilege IAM, access/execution logging, log retention (≥90d), alarms
  (SECURITY-02/06/14).
