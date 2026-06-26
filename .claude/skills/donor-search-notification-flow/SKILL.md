---
name: donor-search-notification-flow
description: Works on BloodConnect's asynchronous donor-search and notification pipeline — H3 geospatial search waves, EventBridge Pipes from the DynamoDB stream, schedulers, SQS/SNS push notifications, and the DonorSearch/H3Search/NearbyBloodRequests services. Use when asked to change "donor search", "search waves/radius", "the notification pipeline", "H3 geospatial matching", "eligible donor selection", "EventBridge pipe", or push-notification delivery. Excludes generic CRUD endpoints (use add-backend-endpoint) and generic infra (use terraform-domain-infra).
---

# Donor-search & notification pipeline

When a blood request is created (status `PENDING`), an EventBridge Pipe on the DynamoDB stream triggers an async, wave-based geospatial search that finds eligible donors via H3 cells and pushes notifications. This is event-driven, not request/response.

## Flow

1. **Trigger** — `aws_pipes_pipe.donation_request_pipe` (`iac/terraform/aws/eventbridge/eventbridge.tf`) reads the DynamoDB stream, filters on `PK`/`SK` prefix `BLOOD_REQ#` + `status = PENDING`, and invokes the `donation-request-initiator` Lambda with an `input_template` carrying `PK/SK/h3Res5/h3Res8/status/previousStatus`.
2. **Initiator** — `donationRequestInitiator` handler → `DonorSearchService.initiateDonorSearchRequest(...)` (`core/application/bloodDonationWorkflow/DonorSearchService.ts`), which schedules search waves via the `SchedulerModel` (EventBridge Scheduler).
3. **Search waves** — `donor-search` Lambda → `DonorSearchService` expands H3 rings outward each wave (tunables `MAX_CELLS_PER_EXECUTION`, `SEARCH_INTERVAL_SECONDS`, `INITIAL_WAVE_DELAY_SECONDS`, `RETRY_DELAY_SECONDS`, `MAX_RETRIES`, `ACCEPTANCE_WINDOW_SECONDS`, `MAX_SEARCH_RADIUS_KM` set in `iac/terraform/aws/donor_search/lambdas.tf`). It uses `H3SearchService` to find donors in hex cells and computes how many to notify with `core/application/utils/calculateDonorsToNotify.ts`.
4. **Notify** — eligible donors are enqueued to the push-notification SQS queue (`NOTIFICATION_QUEUE_URL` → `iac/terraform/aws/notification/queues.tf`, with DLQ + redrive). SNS/SQS delivery wiring lives in `iac/terraform/aws/notification/{sns,sqs_trigger,sqs_policy}.tf`.
5. **Public feed** — `NearbyBloodRequestsService` powers the nearby/feed read path using `h3Res5` (`H3_PUBLIC_FEED_RESOLUTION`).

## Key code

- Services: `core/application/bloodDonationWorkflow/DonorSearchService.ts`, `H3SearchService.ts`, `NearbyBloodRequestsService.ts`.
- H3 utils: `core/application/utils/h3.ts` — `generateH3Cell`, `getH3CellParent`, `getH3GridRing` (with pentagon-safe `gridDiskDistances` fallback), `getH3GridDisk`, `haversineKm`, `getDistanceBetweenH3Cells`. Resolutions are in `commons/libs/constants/NoMagicNumbers` (`H3_DONOR_SEARCH_RESOLUTION` res8, `H3_PUBLIC_FEED_RESOLUTION` res5).
- Wave math: `core/application/utils/calculateDonorsToNotify.ts` (`calculateDelayPeriod`, `calculateTotalDonorsToFind`).
- DDB operations: `core/services/aws/commons/ddbOperations/{DonorSearchDynamoDbOperations,H3SearchDynamoDbOperations,NearbyBloodRequestsDynamoDbOperations}.ts`; models `DonorSearchModel.ts`, `LocationModel.ts`.
- Infra: `iac/terraform/aws/donor_search/{lambdas,sqs,modules,policies}.tf`, `iac/terraform/aws/notification/*`, `iac/terraform/aws/eventbridge/*`.

Reference: `docs/development/DonorSearch.rst`.

## Gotchas

- A blood request row carries two H3 cells: `h3Res8` (donor search) and `h3Res5` (public feed). Both are written at creation in `BloodDonationService.createBloodDonation`; changing resolutions means changing both writers and readers.
- Wave behaviour is tuned by Terraform env vars in `donor_search/lambdas.tf` (mapped into `Config` in `commons/libs/config/config.ts`), not in code constants — change them there.
- `donor_search/sqs.tf` is intentionally empty: queues were migrated to direct Lambda invocation via EventBridge Pipes. Don't re-add SQS for the search trigger.
- `getH3GridRing` falls back to `gridDiskDistances` near H3 pentagons — preserve that guard when editing ring expansion.
- Notification delivery is at-least-once with a DLQ + `maxReceiveCount = 3`; keep handlers idempotent.
- Infra changes go through terraform-domain-infra conventions; validate with `make tf-validate`, and `make test` for the service logic.
