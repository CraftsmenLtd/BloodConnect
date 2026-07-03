locals {
  policies = {
    common = [
      {
        sid       = "ChatLogPolicy"
        actions   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
        resources = ["arn:aws:logs:*:*:*"]
      }
    ]
    table_rw = [
      {
        sid = "ChatTableReadWrite"
        actions = [
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:TransactWriteItems"
        ]
        resources = [var.dynamodb_table_arn, local.gsi1_arn]
      }
    ]
    table_read = [
      {
        sid       = "ChatTableReadOnly"
        actions   = ["dynamodb:GetItem", "dynamodb:Query"]
        resources = [var.dynamodb_table_arn, local.gsi1_arn]
      }
    ]
    manage_connections = [
      {
        sid       = "ChatManageConnections"
        actions   = ["execute-api:ManageConnections"]
        resources = ["${aws_apigatewayv2_api.chat_ws.execution_arn}/*/*/@connections/*"]
      }
    ]
    sqs_send = [
      {
        sid       = "ChatSqsSend"
        actions   = ["sqs:SendMessage"]
        resources = [var.notification_queue_arn]
      }
    ]
    stream_read = [
      {
        sid = "ChatStreamRead"
        actions = [
          "dynamodb:GetRecords",
          "dynamodb:GetShardIterator",
          "dynamodb:DescribeStream",
          "dynamodb:ListStreams"
        ]
        resources = [var.dynamodb_table_stream_arn]
      }
    ]
  }
}
