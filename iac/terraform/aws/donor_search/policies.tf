locals {
  policies = {
    common_policies = [
      {
        sid = "LogPolicy"
        actions = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        resources = [
          "arn:aws:logs:*:*:*"
        ]
      }
    ],
    dynamodb_policy = [
      {
        sid = "DynamodbPolicy"
        actions = [
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:GetItem",
          "dynamodb:Query"
        ]
        resources = [
          var.dynamodb_table_arn,
          "${var.dynamodb_table_arn}/index/LSI1",
          "${var.dynamodb_table_arn}/index/GSI1"
        ]
      }
    ],
    sqs_policy = [
      {
        sid = "SqsPolicy"
        actions = [
          "sqs:SendMessage",
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:ChangeMessageVisibility",
          "sqs:GetQueueAttributes"
        ]
        resources = [
          module.donation_request_queue.queue_arn,
          module.donor_search_queue.queue_arn,
          module.donation_status_manager_queue.queue_arn,
          var.push_notification_queue.arn
        ]
      }
    ]
  }
}
