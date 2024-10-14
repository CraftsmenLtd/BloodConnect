# # SQS Queues
# resource "aws_sqs_queue" "donor_search_queue" {
#   name                       = "donor-search-queue"
#   visibility_timeout_seconds = 30
#   redrive_policy = jsonencode({
#     deadLetterTargetArn = aws_sqs_queue.donor_search_dlq.arn
#     maxReceiveCount     = 5
#   })
# }

# resource "aws_sqs_queue" "donor_search_retry_queue" {
#   name                       = "donor-search-retry-queue"
#   visibility_timeout_seconds = 30
#   redrive_policy = jsonencode({
#     deadLetterTargetArn = aws_sqs_queue.donor_search_dlq.arn
#     maxReceiveCount     = 5
#   })
# }

# resource "aws_sqs_queue" "donor_search_dlq" {
#   name                       = "donor-search-dlq"
#   visibility_timeout_seconds = 60
# }

# # IAM Role for Lambda Execution
# resource "aws_iam_role" "lambda_execution_role" {
#   name = "request-router-lambda-execution-role"

#   assume_role_policy = jsonencode({
#     Version = "2012-10-17",
#     Statement = [
#       {
#         Action = "sts:AssumeRole",
#         Effect = "Allow",
#         Principal = {
#           Service = "lambda.amazonaws.com"
#         },
#       },
#     ],
#   })

#   # Policy to allow Lambda to interact with SQS and Step Functions
#   inline_policy {
#     name = "lambda-sqs-step-functions"
#     policy = jsonencode({
#       Version = "2012-10-17",
#       Statement = [
#         {
#           Action = [
#             "sqs:ReceiveMessage",
#             "sqs:DeleteMessage",
#             "sqs:GetQueueAttributes"
#           ],
#           Effect = "Allow",
#           Resource = [
#             aws_sqs_queue.donor_search_queue.arn,
#             aws_sqs_queue.donor_search_retry_queue.arn
#           ],
#         },
#         {
#           Action   = "states:StartExecution",
#           Effect   = "Allow",
#           Resource = aws_sfn_state_machine.donor_search_state_machine.arn,
#         },
#         {
#           Action = [
#             "logs:CreateLogGroup",
#             "logs:CreateLogStream",
#             "logs:PutLogEvents"
#           ],
#           Effect   = "Allow",
#           Resource = "arn:aws:logs:*:*:*",
#         },
#       ],
#     })
#   }
# }

# # Lambda Function for Request Router
# resource "aws_lambda_function" "request_router_lambda" {
#   function_name    = "request-router-lambda"
#   role             = aws_iam_role.lambda_execution_role.arn
#   handler          = "index.handler"
#   runtime          = "nodejs20.x"
#   filename         = "${path.module}/../../../core/services/aws/.build/zips/request-router-lambda.zip"
#   source_code_hash = filebase64sha256("${path.module}/../../../core/services/aws/.build/zips/request-router-lambda.zip")
#   memory_size      = 128
#   timeout          = 30

#   environment {
#     variables = {
#       DONOR_SEARCH_QUEUE_URL       = aws_sqs_queue.donor_search_queue.url
#       DONOR_SEARCH_RETRY_QUEUE_URL = aws_sqs_queue.donor_search_retry_queue.url
#       # STEP_FUNCTION_ARN            = aws_sfn_state_machine.donor_search_state_machine.arn
#       DYNAMODB_TABLE               = aws_dynamodb_table.donor_requests_table.name
#     }
#   }
# }

# # DynamoDB Table for Donor Requests
# resource "aws_dynamodb_table" "donor_requests_table" {
#   name         = "donor-requests-table"
#   billing_mode = "PAY_PER_REQUEST"
#   hash_key     = "RequestId"

#   attribute {
#     name = "RequestId"
#     type = "S"
#   }

#   attribute {
#     name = "Status"
#     type = "S"
#   }

#   # Add global secondary index if needed
#   global_secondary_index {
#     name            = "StatusIndex"
#     hash_key        = "Status"
#     projection_type = "ALL"
#   }

#   tags = {
#     Name        = "DonorRequestsTable"
#     Environment = "production"
#   }
# }

# # Event Source Mapping for SQS to Lambda
# resource "aws_lambda_event_source_mapping" "donor_search_event_source" {
#   event_source_arn = aws_sqs_queue.donor_search_queue.arn
#   function_name    = aws_lambda_function.request_router_lambda.arn
#   batch_size       = 10
#   enabled          = true
# }

# resource "aws_lambda_event_source_mapping" "donor_search_retry_event_source" {
#   event_source_arn = aws_sqs_queue.donor_search_retry_queue.arn
#   function_name    = aws_lambda_function.request_router_lambda.arn
#   batch_size       = 10
#   enabled          = true
# }

# # IAM Role for Donor Notification Lambda
# resource "aws_iam_role" "donor_notification_lambda_role" {
#   name = "donor-notification-lambda-role"

#   assume_role_policy = jsonencode({
#     Version = "2012-10-17",
#     Statement = [
#       {
#         Action = "sts:AssumeRole",
#         Effect = "Allow",
#         Principal = {
#           Service = "lambda.amazonaws.com"
#         },
#       },
#     ],
#   })

#   # Policy to allow Lambda to interact with necessary resources
#   inline_policy {
#     name = "donor-notification-lambda-policy"
#     policy = jsonencode({
#       Version = "2012-10-17",
#       Statement = [
#         {
#           Action = [
#             "logs:CreateLogGroup",
#             "logs:CreateLogStream",
#             "logs:PutLogEvents"
#           ],
#           Effect   = "Allow",
#           Resource = "arn:aws:logs:*:*:*",
#         },
#         {
#           Action   = "sqs:SendMessage",
#           Effect   = "Allow",
#           Resource = aws_sqs_queue.donor_search_queue.arn
#         },
#         {
#           Action   = "dynamodb:GetItem",
#           Effect   = "Allow",
#           Resource = aws_dynamodb_table.donor_requests_table.arn
#         }
#       ],
#     })
#   }
# }

# # Lambda Function for Donor Notification
# resource "aws_lambda_function" "donor_notification_lambda" {
#   function_name    = "donor-notification-lambda"
#   role             = aws_iam_role.donor_notification_lambda_role.arn
#   handler          = "index.handler"
#   runtime          = "nodejs20.x"
#   filename         = "${path.module}/../../../core/services/aws/.build/zips/donor-notification-lambda.zip"
#   source_code_hash = filebase64sha256("${path.module}/../../../core/services/aws/.build/zips/donor-notification-lambda.zip")
#   memory_size      = 128
#   timeout          = 30

#   environment {
#     variables = {
#       DONOR_SEARCH_QUEUE_URL = aws_sqs_queue.donor_search_queue.url
#       DYNAMODB_TABLE         = aws_dynamodb_table.donor_requests_table.name
#     }
#   }
# }

# # Step Function Definition Updated with Lambda ARN
# resource "aws_sfn_state_machine" "donor_search_state_machine" {
#   name     = "donor-search-state-machine"
#   role_arn = aws_iam_role.donor_notification_lambda_role.arn

#   definition = <<EOF
# {
#   "Comment": "State machine for donor search process",
#   "StartAt": "DonorNotification",
#   "States": {
#     "DonorNotification": {
#       "Type": "Task",
#       "Resource": "${aws_lambda_function.donor_notification_lambda.arn}",
#       "End": true
#     }
#   }
# }
# EOF
# }
