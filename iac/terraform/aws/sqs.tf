resource "aws_sqs_queue" "donor_search_queue" {
  name                      = "${var.environment}-donor-search-queue"
  delay_seconds             = 0
  max_message_size          = 262144
  message_retention_seconds = 86400
  receive_wait_time_seconds = 10

  tags = {
    Environment = var.environment
  }
}

resource "aws_sqs_queue_policy" "donor_search_queue_policy" {
  queue_url = aws_sqs_queue.donor_search_queue.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowEventBridgeSendMessage"
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action   = "sqs:SendMessage"
        Resource = aws_sqs_queue.donor_search_queue.arn
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_cloudwatch_event_rule.blood_request_stream_rule.arn
          }
        }
      }
    ]
  })
}
