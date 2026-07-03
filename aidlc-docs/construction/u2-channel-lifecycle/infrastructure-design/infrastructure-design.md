# U2 Channel Lifecycle — Infrastructure Design

Maps the `chatChannelCreator` stream consumer to AWS. New resources live in a new `chat` Terraform
module (consolidated/wired in U6); declared here.

## Compute — Lambda `chat-channel-creator`
- **Handler**: `chatChannelCreator.default` (bundled via esbuild, like existing Lambdas).
- **Runtime/arch**: Node.js (repo default), same `lambda` module pattern.
- **Env vars**: `DYNAMODB_TABLE_NAME` (from `module.dynamodb.dynamodb_table_name`), region.
- **Log group**: retention **≥ 90 days** (SECURITY-14; note the existing default is 60 — override to 90
  for chat log groups).

## Event source — DynamoDB Stream mapping
```hcl
resource "aws_lambda_event_source_mapping" "chat_channel_creator_stream" {
  event_source_arn       = module.dynamodb.dynamodb_table_stream_arn   # already an output
  function_name          = module.lambda["chat-channel-creator"].lambda_function_name
  starting_position      = "LATEST"
  batch_size             = 10
  function_response_types = ["ReportBatchItemFailures"]
  maximum_retry_attempts  = 3
  bisect_batch_on_function_error = true

  # Only deliver acceptance rows and donation-request rows (reduces invocations)
  filter_criteria {
    filter { pattern = jsonencode({ dynamodb = { Keys = { SK = { S = [{ prefix = "ACCEPTED#" }] } } } }) }
    filter { pattern = jsonencode({ dynamodb = { Keys = { SK = { S = [{ prefix = "BLOOD_REQ#" }] } } } }) }
  }
}
```
- **Filter** keeps the consumer off unrelated items (users, locations, notifications, donor-search,
  messages, connections) — efficiency + least surprise.
- `starting_position = LATEST` so it does not replay historical acceptances on first deploy
  (channels for past requests are not retroactively created — acceptable; documented).

## IAM — least privilege (SECURITY-06)
- **Stream read** (on `dynamodb_table_stream_arn`): `dynamodb:GetRecords`, `GetShardIterator`,
  `DescribeStream`, `ListStreams`.
- **Table** (on table ARN + `${table_arn}/index/GSI1`): `GetItem`, `Query`, `PutItem`,
  `UpdateItem`, `TransactWriteItems` (create channel + memberships, lock, read request/acceptances).
- Split read vs write statements; no wildcards; scoped to the specific table/index/stream ARNs.

## Encryption / logging
- In-transit TLS (AWS SDK); at-rest via the shared table (default encryption).
- API access logging N/A (no API GW here); execution logging via the Lambda log group (SECURITY-03).

## Security mapping
- SECURITY-06 (IAM) ✅ designed; SECURITY-14 (log retention ≥ 90d) ✅; SECURITY-03 (exec logging) ✅;
  SECURITY-01 (at-rest/TLS) ✅ (table-level).
