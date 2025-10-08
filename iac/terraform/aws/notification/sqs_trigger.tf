resource "aws_lambda_event_source_mapping" "sqs_trigger" {
  event_source_arn = aws_sqs_queue.push_notification_queue.arn
  function_name    = module.lambda["send-push-notification"].lambda_function_name
  batch_size       = 10
  enabled          = true

  scaling_config {
    maximum_concurrency = 2
  }
}
