resource "aws_sqs_queue" "donor_search_queue" {
  #checkov:skip=CKV_AWS_27: "Ensure all data stored in the SQS queue is encrypted"
  name                       = "${var.environment}-donor-search"
  visibility_timeout_seconds = 120
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.donor_search_dlq.arn
    maxReceiveCount     = 3
  })
}

resource "aws_sqs_queue" "donor_search_retry_queue" {
  #checkov:skip=CKV_AWS_27: "Ensure all data stored in the SQS queue is encrypted"
  name                       = "${var.environment}-donor-search-retry"
  visibility_timeout_seconds = 120
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.donor_search_dlq.arn
    maxReceiveCount     = 3
  })
}

resource "aws_sqs_queue" "donor_search_dlq" {
  #checkov:skip=CKV_AWS_27: "Ensure all data stored in the SQS queue is encrypted"
  name                       = "${var.environment}-donor-search-dlq"
  visibility_timeout_seconds = 120
}

resource "aws_lambda_event_source_mapping" "donor_search_event_source" {
  event_source_arn = aws_sqs_queue.donor_search_queue.arn
  function_name    = module.donor_router_lambda["donor-request-router"].lambda_arn
  batch_size       = 10
  enabled          = true
}

resource "aws_lambda_event_source_mapping" "donor_search_retry_event_source" {
  event_source_arn = aws_sqs_queue.donor_search_retry_queue.arn
  function_name    = module.donor_router_lambda["donor-request-router"].lambda_arn
  batch_size       = 10
  enabled          = true
}

resource "aws_sqs_queue_policy" "donor_search_queue_policy" {
  queue_url = aws_sqs_queue.donor_search_queue.id
  policy    = data.aws_iam_policy_document.donor_search_queue_policy_doc.json
}

data "aws_iam_policy_document" "donor_search_queue_policy_doc" {
  statement {
    actions = ["sqs:SendMessage"]
    effect  = "Allow"
    principals {
      type        = "Service"
      identifiers = ["pipes.amazonaws.com"]
    }
    resources = [aws_sqs_queue.donor_search_queue.arn]
  }
}
