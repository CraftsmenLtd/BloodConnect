resource "aws_sqs_queue" "push_notification_dlq" {
  name = "${var.environment}-push-notification-dlq"
  message_retention_seconds = 1209600 # 14 days
}

resource "aws_sqs_queue" "push_notification_queue" {
  name = "${var.environment}-push-notification-queue"
  visibility_timeout_seconds = 60
  message_retention_seconds = 345600 # 4 days
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.push_notification_dlq.arn
    maxReceiveCount     = 3
  })
}
