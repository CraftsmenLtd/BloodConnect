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
        resources = [var.dynamodb_table_arn]
      }
    ],
    cognito_policy = [
      {
        sid = "CognitoPolicy"
        actions = [
          "cognito-idp:AdminUpdateUserAttributes"
        ]
        resources = [
        "arn:aws:cognito-idp:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:userpool/*"]
      }
    ],
    ses_policy = [
      {
        sid = "SESPolicy"
        actions = [
          "ses:SendEmail",
          "ses:SendRawEmail"
        ]
        resources = [
          var.verified_domain_arn,
          "arn:aws:ses:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:identity/*"
        ]
      }
    ]
  }
}
