resource "aws_sqs_queue" "push_notification_dlq" {
  #checkov:skip=CKV_AWS_27: "Ensure all data stored in the SQS queue is encrypted"
  name = "${var.environment}-push-notification-dlq"
  message_retention_seconds = 1209600 # 14 days
}

resource "aws_sqs_queue" "push_notification_queue" {
  #checkov:skip=CKV_AWS_27: "Ensure all data stored in the SQS queue is encrypted"
  name = "${var.environment}-push-notification-queue"
  visibility_timeout_seconds = 60
  message_retention_seconds = 345600 # 4 days
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.push_notification_dlq.arn
    maxReceiveCount     = 3
  })
}
