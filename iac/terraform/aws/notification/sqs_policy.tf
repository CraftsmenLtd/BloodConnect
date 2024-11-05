resource "aws_sqs_queue_policy" "push_notification_queue" {
  queue_url = aws_sqs_queue.push_notification_queue.url

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = module.lambda["send-notification"].lambda_role_arn
        }
        Action = [
          "sqs:SendMessage"
        ]
        Resource = aws_sqs_queue.push_notification_queue.arn
      }
    ]
  })
}
