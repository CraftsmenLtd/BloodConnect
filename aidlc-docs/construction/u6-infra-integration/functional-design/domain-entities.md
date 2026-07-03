# U6 Infrastructure & Integration — Resource Inventory

> U6 is an infrastructure unit — **no domain entities**. This catalogs the infrastructure resources
> (the "entities" U6 manages).

## Terraform resources (new `iac/terraform/aws/chat/`)
| Resource | Purpose |
|---|---|
| `module "lambda"` (×9, for_each) | the 9 chat Lambdas + their IAM |
| `aws_apigatewayv2_api` (WEBSOCKET) | the chat WebSocket API |
| `aws_apigatewayv2_route` (×6) | `$connect`/`$disconnect`/`sendMessage`/`typing`/`markRead`/`$default` |
| `aws_apigatewayv2_integration` (×6) | AWS_PROXY → handler Lambdas |
| `aws_apigatewayv2_authorizer` (REQUEST) | Cognito JWT on `$connect` |
| `aws_apigatewayv2_stage` | logging + retention |
| `aws_apigatewayv2_deployment` | stage deployment |
| `aws_lambda_permission` (×N) | API GW + stream invoke perms |
| `aws_lambda_event_source_mapping` | DynamoDB stream → `chat-channel-creator` |
| `aws_cloudwatch_log_group` | WS access logs (≥90d) |

## OpenAPI / REST artifacts
| Artifact | Purpose |
|---|---|
| `openapi/versions/v1.json` (edit) | register `GET /chat/history` + `GET /chat/channels` |
| `openapi/integration/aws/chat/get-history.json` | REST integration (VTL) for history |
| `openapi/integration/aws/chat/list-channels.json` | REST integration (VTL) for channels |

## Root wiring
| Artifact | Purpose |
|---|---|
| `iac/terraform/aws/modules.tf` (edit) | instantiate `module "chat"` with table/stream/queue/cognito inputs |
| LocalStack deployment (edit) | same module + caveats |

## Inputs (module variables)
`environment`, `dynamodb_table_arn`, `dynamodb_table_stream_arn`, `notification_queue_url`,
`cognito_user_pool_id`, `cognito_client_id`.

## Outputs
`websocket_api_endpoint` (the WSS URL for the mobile `WEBSOCKET_URL`).
