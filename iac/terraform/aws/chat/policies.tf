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
    ],
    chat_read_policy = [
      {
        sid = "ChatReadPolicy"
        actions = [
          "dynamodb:GetItem",
          "dynamodb:Query"
        ]
        resources = [
          var.dynamodb_chat_table_arn,
          "${var.dynamodb_chat_table_arn}/index/GSI1"
        ]
      }
    ],
    chat_connection_policy = [
      {
        sid = "ChatConnectionPolicy"
        actions = [
          "dynamodb:PutItem",
          "dynamodb:DeleteItem",
          "dynamodb:GetItem",
          "dynamodb:Query"
        ]
        resources = [
          var.dynamodb_chat_table_arn,
          "${var.dynamodb_chat_table_arn}/index/GSI1"
        ]
      }
    ],
    cognito_get_user_policy = [
      {
        sid = "CognitoGetUserPolicy"
        actions = [
          "cognito-idp:GetUser"
        ]
        resources = [var.cognito_user_pool_arn]
      }
    ],
    websocket_manage_policy = [
      {
        sid = "WebSocketManageConnectionsPolicy"
        actions = [
          "execute-api:ManageConnections"
        ]
        resources = [
          "arn:aws:execute-api:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:*/*"
        ]
      }
    ],
    sqs_policy = [
      {
        sid = "SqsPolicy"
        actions = [
          "sqs:SendMessage"
        ]
        resources = [var.push_notification_queue.arn]
      }
    ]
  }
}
