resource "aws_lambda_event_source_mapping" "chat_channel_creator" {
  event_source_arn               = var.dynamodb_table_stream_arn
  function_name                  = module.lambda["chat-channel-creator"].lambda_function_name
  starting_position              = "LATEST"
  batch_size                     = 10
  function_response_types        = ["ReportBatchItemFailures"]
  bisect_batch_on_function_error = true

  filter_criteria {
    filter {
      pattern = jsonencode({
        dynamodb = {
          Keys = {
            SK = {
              S = [
                { prefix = "ACCEPTED#" },
                { prefix = "BLOOD_REQ#" }
              ]
            }
          }
        }
      })
    }
  }
}
