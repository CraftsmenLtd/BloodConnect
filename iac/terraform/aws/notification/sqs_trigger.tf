resource "aws_lambda_event_source_mapping" "sqs_trigger" {
  event_source_arn = aws_sqs_queue.push_notification_queue.arn
  function_name    = module.lambda["process-notification"].lambda_function_name
  batch_size       = 1
  enabled          = true
}
