resource "aws_sqs_queue" "this" {
  #checkov:skip=CKV_AWS_27: "Ensure all data stored in the SQS queue is encrypted"
  name                       = "${var.environment}-${var.queue_name}"
  visibility_timeout_seconds = var.visibility_timeout_seconds
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq.arn
    maxReceiveCount     = var.max_receive_count
  })
}

resource "aws_sqs_queue" "dlq" {
  #checkov:skip=CKV_AWS_27: "Ensure all data stored in the SQS queue is encrypted"
  name                       = "${var.environment}-${var.queue_name}-dlq"
  visibility_timeout_seconds = var.visibility_timeout_seconds
}

resource "aws_lambda_event_source_mapping" "this" {
  count            = var.enable_lambda_event_source ? 1 : 0
  event_source_arn = aws_sqs_queue.this.arn
  function_name    = var.lambda_function_arn
  batch_size       = var.batch_size
  enabled          = true

  scaling_config {
    maximum_concurrency = 2
  }
}

resource "aws_sqs_queue_policy" "this" {
  queue_url = aws_sqs_queue.this.id
  policy    = data.aws_iam_policy_document.this.json
}

data "aws_iam_policy_document" "this" {
  statement {
    actions = ["sqs:SendMessage"]
    effect  = "Allow"
    principals {
      type        = "Service"
      identifiers = ["pipes.amazonaws.com"]
    }
    resources = [aws_sqs_queue.this.arn]
  }
}