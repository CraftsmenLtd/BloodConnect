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
          "dynamodb:GetItem",
          "dynamodb:UpdateItem"
        ]
        resources = [aws_dynamodb_table.donor_requests_table.arn]
      }
    ],
    sfn_policy = [
      {
        sid = "StepFunctionPolicy"
        actions = [
          "states:StartExecution"
        ]
        resources = ["*"]
      }
    ],
    sqs_policy = [
      {
        sid = "SqsPolicy"
        actions = [
          "sqs:SendMessage"
        ]
        resources = [aws_sqs_queue.donor_search_retry_queue.arn]
      }
    ]
  }
}
