# Reverse Engineering Metadata

**Analysis Date**: 2026-06-26T00:10:00Z
**Analyzer**: AI-DLC
**Workspace**: /Users/sadekur/projects/craftsmen/BloodConnect
**Scope**: Feature-scoped to Issue #571 (in-app chat). System documented at high level; donation
acceptance, notification, data store, and mobile activity areas documented in depth.

## Artifacts Generated
- [x] business-overview.md
- [x] architecture.md
- [x] code-structure.md
- [x] api-documentation.md
- [x] component-inventory.md
- [x] technology-stack.md
- [x] reverse-engineering-timestamp.md

## Not Generated (deliberately, for this feature-scoped pass)
- [ ] dependencies.md — covered inline in code-structure.md / technology-stack.md
- [ ] code-quality-assessment.md — not needed to scope a new feature; can be added on request

## Key Grounded Facts (verified against code)
- DynamoDB single table: `PK`/`SK`, `LSI1`, `GSI1`; `stream_enabled = true`,
  `stream_view_type = "NEW_AND_OLD_IMAGES"` (`iac/terraform/aws/dynamodb/dynamodb.tf`).
- Acceptance key model (verified against `AcceptDonationModel.ts` and `docs/architecture/Database.rst`):
  `PK = BLOOD_REQ#<seekerId>`, `SK = ACCEPTED#<requestPostId>#<donorId>`
  (`ACCEPTED_DONATION_PK_PREFIX = 'BLOOD_REQ'` — the constant name is misleading). Acceptances
  co-locate in the blood-request partition.
- **As-built schema source of truth**: `docs/architecture/Database.rst` — single table, overloaded
  GSI1/LSI1 (LSI1 written but not read), `NotificationType` segments, H3 geospatial keys.
- `NotificationType = BLOOD_REQ_POST | REQ_ACCEPTED | REQ_IGNORED | COMMON`
  (`commons/dto/NotificationDTO.ts`).
- Push path: domain service -> SQS push queue -> `send-push-notification` Lambda -> SNS
  (APNs/FCM); SQS trigger `batch_size = 10`, `ReportBatchItemFailures`.
- No WebSocket API Gateway and no DynamoDB-stream Lambda consumer currently exist in the repo.
