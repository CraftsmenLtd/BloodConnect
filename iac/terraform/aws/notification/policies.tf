locals {
  policies = {
    common_policies = [
      {
        sid = "LogPolicy"
        actions = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        resources = ["arn:aws:logs:*:*:*"]
      }
    ],
    dynamodb_query_policy = [
      {
        sid = "DynamoDBQueryPolicy"
        actions = [
          "dynamodb:GetItem",
          "dynamodb:Query"
        ]
        resources = [var.dynamodb_table_arn]
      }
    ],
    sqs_send_policy = [
      {
        sid = "SQSSendPolicy"
        actions = ["sqs:SendMessage"]
        resources = [aws_sqs_queue.push_notification_queue.arn]
      }
    ],
    sns_publish_policy = [
      {
        sid = "SNSPublishPolicy"
        actions = ["sns:Publish"]
        resources = [aws_sns_topic.push_notification.arn]
      }
    ]
  }
}
