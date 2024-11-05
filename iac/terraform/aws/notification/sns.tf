resource "aws_sns_topic" "push_notification" {
  name              = "${var.environment}-push-notification-topic"
}

resource "aws_sns_topic_policy" "push_notification" {
  arn = aws_sns_topic.push_notification.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowLambdaPublish"
        Effect    = "Allow"
        Principal = {
          AWS = module.lambda["process-notification"].lambda_role_arn
        }
        Action    = "sns:Publish"
        Resource  = aws_sns_topic.push_notification.arn
      }
    ]
  })
}
