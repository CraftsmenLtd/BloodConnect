resource "aws_sns_topic" "push_notification" {
  #checkov:skip=CKV_AWS_26: "Ensure all data stored in the SNS topic is encrypted"
  name = "${var.environment}-push-notification-topic"
}

resource "aws_sns_topic_policy" "push_notification" {
  arn = aws_sns_topic.push_notification.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowSQSSubscription"
        Effect    = "Allow"
        Principal = {
          Service = "sqs.amazonaws.com"
        }
        Action    = "sns:Subscribe"
        Resource  = aws_sns_topic.push_notification.arn
      }
    ]
  })
}

resource "aws_sns_topic_subscription" "push_notification_sqs" {
  topic_arn = aws_sns_topic.push_notification.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.push_notification_queue.arn
}
