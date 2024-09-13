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
    cognito_policies = [
      {
        sid = "CognitoPolicy"
        actions = [
          "cognito-idp:AdminCreateUser"
        ]
        resources = [
          var.user_pool_arn
        ]
      }
    ]
  }
}
