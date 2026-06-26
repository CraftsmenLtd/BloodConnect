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
          "dynamodb:GetItem",
          "dynamodb:Query"
        ]
        resources = [var.dynamodb_table_arn]
      }
    ],
    dynamodb_update_policy = [
      {
        sid = "DynamodbUpdatePolicy"
        actions = [
          "dynamodb:UpdateItem",
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:DeleteItem"
        ]
        resources = [
          var.dynamodb_table_arn,
          "${var.dynamodb_table_arn}/index/GSI1"
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
    ],
    # Lets the fanout (sendMessage) lambda post messages back to live WebSocket connections.
    manage_connections_policy = [
      {
        sid = "ManageConnectionsPolicy"
        actions = [
          "execute-api:ManageConnections"
        ]
        resources = [
          "${aws_apigatewayv2_api.chat.execution_arn}/*"
        ]
      }
    ]
  }
}
