# U2 Channel Lifecycle — Deployment Architecture

## Packaging
- Handler `core/services/aws/chat/chatChannelCreator.ts` bundled by esbuild (`make build-node-all`)
  into `chatChannelCreator.js`, deployed via the existing `lambda` Terraform module pattern.

## Terraform (new `chat` module — consolidated in U6)
- `aws_lambda_event_source_mapping.chat_channel_creator_stream` → `module.dynamodb.dynamodb_table_stream_arn`.
- Lambda definition (handler/env/policies) following `iac/terraform/aws/notification/lambdas.tf` shape.
- IAM policy statements per `infrastructure-design.md`.

## Environments
- **AWS** (ap-south-1) and **LocalStack** — LocalStack supports DynamoDB Streams + Lambda
  event-source mappings; U6 verifies parity (`make start-dev`).

## Rollout / Rollback
- **Rollout**: deploy Lambda + event-source mapping; `starting_position = LATEST` avoids replaying
  history.
- **Rollback**: disable/remove the event-source mapping → channel auto-create/lock stops; no data
  migration; chat data is TTL'd. The acceptance/request producers are unaffected.

## Validation
- LocalStack: accept a request → confirm a `CHAT_CHANNEL#` META item + 2 membership items appear;
  complete the request → confirm channel status flips to `LOCKED`.
