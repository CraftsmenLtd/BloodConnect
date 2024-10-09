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
    dynamodb_create_policy = [
      {
        sid = "DynamodbCreatePolicy"
        actions = [
          "dynamodb:PutItem",
        ]
        resources = [var.dynamodb_table_arn]
      }
    ]
  }
}
