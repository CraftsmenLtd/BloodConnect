resource "aws_sqs_queue" "donor_search_queue" {
  name                       = "${var.environment}-donor-search"
  visibility_timeout_seconds = 30
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.donor_search_dlq.arn
    maxReceiveCount     = 5
  })
}

resource "aws_sqs_queue" "donor_search_retry_queue" {
  name                       = "${var.environment}-donor-search-retry"
  visibility_timeout_seconds = 30
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.donor_search_dlq.arn
    maxReceiveCount     = 5
  })
}

resource "aws_sqs_queue" "donor_search_dlq" {
  name                       = "${var.environment}-donor-search-dlq"
  visibility_timeout_seconds = 60
}

resource "aws_lambda_event_source_mapping" "donor_search_event_source" {
  event_source_arn = aws_sqs_queue.donor_search_queue.arn
  function_name    = module.lambda["donor-request-router"].lambda_arn
  batch_size       = 10
  enabled          = true
}

resource "aws_lambda_event_source_mapping" "donor_search_retry_event_source" {
  event_source_arn = aws_sqs_queue.donor_search_retry_queue.arn
  function_name    = module.lambda["donor-request-router"].lambda_arn
  batch_size       = 10
  enabled          = true
}
