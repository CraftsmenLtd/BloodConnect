# Least-privilege IAM policy fragments for the chat Lambdas.
# Each fragment is a single-statement list, concatenated per handler in lambdas.tf
# and consumed by the shared ./../lambda module, which builds the role inline.
locals {
  chat_policies = {
    # All handlers: CloudWatch Logs.
    logs = [
      {
        sid = "ChatLogPolicy"
        actions = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        resources = ["arn:aws:logs:*:*:*"]
      }
    ]

    # connectChatSession: record the WSCONN# connection row.
    connection_write = [
      {
        sid = "ChatConnectionWrite"
        actions = [
          "dynamodb:PutItem",
          "dynamodb:GetItem"
        ]
        resources = [var.dynamodb_table_arn]
      }
    ]

    # disconnectChatSession: delete the connection row (query-by-user to locate it).
    connection_delete = [
      {
        sid = "ChatConnectionDelete"
        actions = [
          "dynamodb:DeleteItem",
          "dynamodb:Query"
        ]
        resources = [var.dynamodb_table_arn]
      }
    ]

    # sendChatMessage: persist message, atomic lock-check write, unread/preview update,
    # rate-limit + recipient-connection queries (all single-table partitions, no GSI).
    message_write = [
      {
        sid = "ChatMessageWrite"
        actions = [
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:GetItem",
          "dynamodb:Query"
        ]
        resources = [var.dynamodb_table_arn]
      }
    ]

    # getChannelHistory: paginated read of a message partition.
    history_read = [
      {
        sid = "ChatHistoryRead"
        actions = [
          "dynamodb:Query",
          "dynamodb:GetItem"
        ]
        resources = [var.dynamodb_table_arn]
      }
    ]

    # markChannelRead: reset the caller's inbox-pointer unreadCount (single UpdateItem).
    unread_reset = [
      {
        sid = "ChatUnreadReset"
        actions = [
          "dynamodb:UpdateItem"
        ]
        resources = [var.dynamodb_table_arn]
      }
    ]

    # sendChatMessage: server -> client push via the API Gateway Management API.
    manage_connections = [
      {
        sid       = "ChatManageConnections"
        actions   = ["execute-api:ManageConnections"]
        resources = ["${aws_apigatewayv2_api.chat_websocket.execution_arn}/*"]
      }
    ]

    # sendChatMessage: enqueue CHAT_MESSAGE onto the existing push-notification queue
    # when the recipient has no live connection.
    push_notification = [
      {
        sid       = "ChatPushNotification"
        actions   = ["sqs:SendMessage"]
        resources = [var.push_notification_queue.arn]
      }
    ]
  }
}
