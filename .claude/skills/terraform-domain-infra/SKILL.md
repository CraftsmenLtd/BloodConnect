---
name: terraform-domain-infra
description: Adds or changes per-domain AWS infrastructure in BloodConnect's Terraform (SQS queues, SNS topics, EventBridge pipes/rules, IAM policies, DynamoDB streams) following the repo's module conventions under iac/terraform/aws/<domain>/. Use when asked to "add a queue/topic", "wire EventBridge", "create an IAM policy", "add Terraform infra for a domain", "set up a DLQ", or change resource config. Excludes registering a Lambda for an HTTP endpoint (use add-backend-endpoint) and the donor-search/notification pipeline specifics (use donor-search-notification-flow).
---

# Per-domain Terraform infrastructure

AWS resources live under `iac/terraform/aws/`, organized per domain. Each domain folder follows the same file split (see `iac/terraform/aws/donation/`):

- `lambdas.tf` — `local.lambda_options` map of Lambda configs.
- `modules.tf` — `module "lambda" { for_each = local.lambda_options; source = "./../lambda"; ... }` (shared module `iac/terraform/aws/lambda/`).
- `policies.tf` — reusable IAM policy statements as `local.policies.*` (e.g. `common_policies`, `dynamodb_create_policy`, `sqs_policy`), concatenated into each lambda's `statement`.
- `data.tf` — `aws_caller_identity` / `aws_region` and other lookups.
- `variables.tf` / `outputs.tf` — inputs (e.g. `environment`, `dynamodb_table_arn`, queue objects) and exported metadata.

Resource-type examples to copy:
- SQS queues + DLQ + redrive: `iac/terraform/aws/notification/queues.tf` (named `${var.environment}-...`, `redrive_policy` to a `*-dlq` with `maxReceiveCount`).
- SNS topics / SQS triggers: `iac/terraform/aws/notification/sns.tf`, `sqs_trigger.tf`, `sqs_policy.tf`.
- EventBridge Pipes / rules / IAM: `iac/terraform/aws/eventbridge/` (`eventbridge.tf`, `iam.tf`, `policies.tf`, `logging.tf`) — e.g. an `aws_pipes_pipe` from a DynamoDB stream to a Lambda with `filter_criteria` and an `input_template`.

## Checklist

1. Put the resource in the correct domain folder, or create a new `iac/terraform/aws/<domain>/` mirroring the file split above and wire it from the deployment root (`deployment/aws/terraform` and `deployment/localstack/terraform`).
2. Name every resource `${var.environment}-<purpose>` so envs don't collide.
3. For queues, always pair with a DLQ + `redrive_policy`. Set explicit `visibility_timeout_seconds` / `message_retention_seconds`.
4. Grant least-privilege IAM via `local.policies.*` in `policies.tf`; reference ARNs/URLs through variables, not hardcoded strings.
5. Pass cross-domain wiring (queue URLs/ARNs, table ARN/stream ARN) as variables/outputs, not by reaching into another module.
6. Checkov runs in CI; suppress only with an inline justified skip, e.g. `#checkov:skip=CKV_AWS_27: "..."`. Global skips are listed in the root `Makefile` (`TF_CHECKOV_SKIP`).
7. Validate: `make tf-validate` (also part of `make lint`). Plan against LocalStack via `make run-command-tf-plan-apply` (see local-dev-localstack).

Reference: `docs/devops/IaC.rst`.

## Gotchas

- LocalStack and real AWS share the `iac/terraform/aws/` modules but apply through different deployment dirs (`deployment/localstack/terraform` vs `deployment/aws/terraform`) — make sure new top-level modules are referenced in both.
- Several `CKV_AWS_*` checks are intentionally skipped at the Makefile level (VPC, X-Ray, DLQ, code-signing, concurrency); match existing per-resource skip comments rather than inventing new ones.
- Lambda registration for an HTTP route belongs in add-backend-endpoint; this skill is for the surrounding infra (queues/topics/events/IAM).
- The donor-search/notification async pipeline has its own wiring — use donor-search-notification-flow.
