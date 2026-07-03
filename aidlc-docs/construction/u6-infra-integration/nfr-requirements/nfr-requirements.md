# U6 Infrastructure & Integration — NFR Requirements

## Deployability
- **NFR-U6-D1**: The chat module deploys via the existing Terraform pipeline (`make` targets) to both
  **AWS** (ap-south-1) and **LocalStack**, with no manual steps beyond `terraform apply`.
- **NFR-U6-D2**: Module is **idempotent** (re-apply is a no-op when unchanged) and **additive** (no
  changes to existing resources except the already-applied table TTL).

## Availability / Scalability
- **NFR-U6-A1**: API Gateway (WebSocket + REST) and Lambda scale on demand; DynamoDB `PAY_PER_REQUEST`.
- **NFR-U6-A2**: Stream consumer uses partial-batch-failure so a poison record does not stall the shard.

## Observability
- **NFR-U6-O1**: WebSocket + REST stages emit access + execution logs; log groups have retention
  ≥ 90 days (SECURITY-14); no message payloads in logs (`data_trace=false`).
- **NFR-U6-O2**: Lambda errors visible in CloudWatch; (optional) alarms for authorizer/authz failures.

## Security
- **NFR-U6-S1 (SECURITY-06)**: Per-Lambda least-privilege IAM; read-only for REST read Lambdas;
  `@connections/*`-scoped manage perms; single `sqs:SendMessage` grant.
- **NFR-U6-S2 (SECURITY-01)**: TLS everywhere (WSS/HTTPS); at-rest encryption (shared table).

## Cost
- **NFR-U6-C1**: On-demand everything; TTL purges chat data at 90 days to bound storage.

## Maintainability
- **NFR-U6-M1**: Mirrors the existing `notification`/`lambda` module patterns (`for_each` lambda_options);
  a reviewer familiar with the repo can read it.
- **NFR-U6-M2**: Verifiable via `terraform fmt -check` + `terraform validate` + Spectral lint (Build & Test).

## Constraints / verification limits
- `terraform validate` + LocalStack/AWS deploy require the operator's environment (terraform CLI +
  Docker) — provided as Build-and-Test instructions.
