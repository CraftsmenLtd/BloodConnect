# U6 Infrastructure & Integration — Terraform File Inventory

## New module `iac/terraform/aws/chat/`
- **`variables.tf`** — `environment`, `dynamodb_table_arn`, `dynamodb_table_stream_arn`,
  `notification_queue_arn`, `notification_queue_url`, `cognito_user_pool_id`, `cognito_client_id`.
- **`lambdas.tf`** — `locals { lambda_options = { ...9 chat lambdas with handler/js_file_name/env/statement } }`.
- **`modules.tf`** — `module "lambda" { for_each = local.lambda_options; source = "./../lambda"; ... }`.
- **`websocket.tf`** — `aws_apigatewayv2_api` (WEBSOCKET) + 6 routes + integrations + REQUEST authorizer
  + stage (logging) + deployment + `aws_lambda_permission`s + `aws_cloudwatch_log_group`.
- **`stream_trigger.tf`** — `aws_lambda_event_source_mapping` (stream → chat-channel-creator).
- **`outputs.tf`** — `websocket_api_endpoint`.

## Edits to existing files
- **`iac/terraform/aws/modules.tf`** — instantiate `module "chat"` with inputs from
  `module.database` (+ notification queue + cognito) and the dynamodb stream arn output.
- **`openapi/versions/v1.json`** — register `GET /chat/history` + `GET /chat/channels`.
- **`openapi/integration/aws/chat/get-history.json`** + **`list-channels.json`** — REST VTL integrations.
- **LocalStack deployment** — same module + caveat doc.

## Reused (no change)
- Shared `lambda` module, `dynamodb` module outputs (table/stream arn), notification SQS queue, Cognito.

## Component Interaction (deploy-time)
```
modules.tf -> module "chat" -> { lambdas (for_each), websocket api+authorizer+routes, stream mapping }
openapi/versions/v1.json -> REST routes -> chat-get-history / chat-list-channels (via integration VTL)
outputs.websocket_api_endpoint -> mobile WEBSOCKET_URL (per environment)
```

## Verification artifacts (Build & Test)
- `terraform fmt -check` + `terraform validate` (chat module).
- `make bundle-openapi` + `spectral lint`.
- LocalStack `make start-dev` e2e walkthrough.
