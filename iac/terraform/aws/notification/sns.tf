resource "aws_sns_topic" "push_notification" {
  #checkov:skip=CKV_AWS_26: "Ensure all data stored in the SNS topic is encrypted"
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
          AWS = module.lambda["process-notification"].role_arn
        }
        Action    = "sns:Publish"
        Resource  = aws_sns_topic.push_notification.arn
      }
    ]
  })
}
