# U6 Infrastructure & Integration — Tech Stack Decisions

| Concern | Decision | Rationale |
|---|---|---|
| IaC | Terraform (existing) | Repo standard; reuse `lambda` + module patterns. |
| WebSocket API | `aws_apigatewayv2_api` (WEBSOCKET) + routes/integrations/authorizer/stage | Native, matches ticket Q2=A. |
| Lambda registration | shared `./../lambda` module via `for_each = local.lambda_options` | Mirrors `notification/`. |
| Stream trigger | `aws_lambda_event_source_mapping` + `filter_criteria` + `ReportBatchItemFailures` | Mirrors `notification/sqs_trigger.tf` style. |
| REST routes | OpenAPI-driven (`openapi/versions/v1.json` + integration VTL + ARN placeholders) | Matches existing REST API deploy. |
| Logging | API GW access/exec logs → CloudWatch (retention ≥90d, `data_trace=false`) | SECURITY-02/03/14. |
| Local dev | LocalStack (existing deployment) | NFR-6 (Q10=C). |

## New Dependencies
- **None** (Terraform providers already present). New AWS SDK client (`apigatewaymanagementapi`) +
  `aws-jwt-verify` were added in U3 (runtime), not here.

## Verification tooling (Build & Test)
- `terraform fmt -check` + `terraform validate`; `make bundle-openapi` + `spectral lint`; LocalStack
  `make start-dev` e2e.
