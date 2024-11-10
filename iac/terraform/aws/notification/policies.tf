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
          "dynamodb:UpdateItem",
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:Query"
        ]
        resources = [var.dynamodb_table_arn]
      }
    ],
    sqs_send_policy = [
      {
        sid       = "SQSSendPolicy"
        actions   = ["sqs:SendMessage"]
        resources = [aws_sqs_queue.push_notification_queue.arn]
      }
    ],
    sqs_receive_policy = [
      {
        sid = "SQSReceivePolicy"
        actions = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes",
          "sqs:ChangeMessageVisibility"
        ]
        resources = [aws_sqs_queue.push_notification_queue.arn]
      }
    ],
    sns_publish_policy = [
      {
        sid = "SNSPublishPolicy"
        actions = [
          "sns:Publish",
          "sns:CreatePlatformEndpoint"
        ]
        resources = [aws_sns_platform_application.android_app.arn]
      }
    ]
  }
}
