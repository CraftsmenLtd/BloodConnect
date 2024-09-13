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
        resources = ["arn:aws:logs:*:*:*"]
      }
    ],
    cognito_policies = [
      {
        sid = "CognitoPolicy"
        actions = [
          "cognito-idp:AdminCreateUser",
          "cognito-idp:AdminAddUserToGroup"
        ]
        resources = [var.user_pool_arn]
      }
    ],
    dynamodb_policies = [
      {
        sid = "DynamodbPolicy"
        actions = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem"
        ]
        resources = [var.dynamodb_table_arn]
      }
    ]
  }
}
