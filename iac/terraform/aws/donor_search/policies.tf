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
          "dynamodb:UpdateItem",
          "dynamodb:GetItem",
          "dynamodb:Query"
        ]
        resources = [
          var.dynamodb_table_arn,
          "${var.dynamodb_table_arn}/index/LSI1",
          "${var.dynamodb_table_arn}/index/GSI1"
        ]
      }
    ],
    sqs_policy = [
      {
        sid = "SqsPolicy"
        actions = [
          "sqs:SendMessage",
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:ChangeMessageVisibility",
          "sqs:GetQueueAttributes"
        ]
        resources = [
          var.push_notification_queue.arn
        ]
      }
    ],
    scheduler_policy = [
      {
        sid    = "EventBridgeSchedulerPolicy",
        Effect = "Allow",
        actions = [
          "scheduler:CreateSchedule",
          "scheduler:UpdateSchedule",
          "scheduler:DeleteSchedule",
          "scheduler:GetSchedule",
          "scheduler:ListSchedules"
        ]
        resources = [
          "arn:aws:scheduler:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:schedule/*"
        ]
      },
      {
        sid    = "AllowPassRoleToScheduler",
        Effect = "Allow",
        actions = [
          "iam:PassRole"
        ]
        resources = [
          local.eventbridge_scheduler_role_arn
        ]
        conditions = {
          StringEquals = {
            "iam:PassedToService" = "scheduler.amazonaws.com"
          }
        }
      },
      {
        sid    = "AllowSchedulerServiceInvokeLambda"
        Effect = "Allow"
        actions = [
          "lambda:InvokeFunction"
        ]
        resources = [
          "arn:aws:lambda:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:function:${local.donor_search_lambda_name}:*",
          "arn:aws:lambda:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:function:${local.donor_search_lambda_name}"
        ]
        principals = [
          {
            type        = "Service"
            identifiers = ["scheduler.amazonaws.com"]
          }
        ]
      },
     
    ]
  }
}
