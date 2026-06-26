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
    chat_create_policy = [
      {
        sid = "ChatCreatePolicy"
        actions = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:Query"
        ]
        resources = [
          var.dynamodb_chat_table_arn,
          "${var.dynamodb_chat_table_arn}/index/GSI1"
        ]
      }
    ],
    chat_update_policy = [
      {
        sid = "ChatUpdatePolicy"
        actions = [
          "dynamodb:UpdateItem",
          "dynamodb:GetItem"
        ]
        resources = [var.dynamodb_chat_table_arn]
      }
    ]
  }
}
