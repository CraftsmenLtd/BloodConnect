resource "aws_sqs_queue_policy" "push_notification_queue" {
  queue_url = aws_sqs_queue.push_notification_queue.url

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "sns.amazonaws.com"
        }
        Action = [
          "sqs:SendMessage"
        ]
        Resource = aws_sqs_queue.push_notification_queue.arn
        Condition = {
          ArnEquals = {
            "aws:SourceArn": aws_sns_topic.push_notification.arn
          }
        }
      }
    ]
  })
}
