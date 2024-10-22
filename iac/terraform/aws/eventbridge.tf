resource "aws_sqs_queue" "donor_search_queue" {
  #checkov:skip=CKV_AWS_27: "Ensure all data stored in the SQS queue is encrypted"
  name                      = "${var.environment}-donor-search-queue"
  delay_seconds             = 0
  max_message_size          = 262144
  message_retention_seconds = 86400
  receive_wait_time_seconds = 10
}

resource "aws_sqs_queue_policy" "donor_search_queue_policy" {
  queue_url = aws_sqs_queue.donor_search_queue.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowEventBridgePipeSendMessage"
        Effect = "Allow"
        Principal = {
          Service = "pipes.amazonaws.com"
        }
        Action   = "sqs:SendMessage"
        Resource = aws_sqs_queue.donor_search_queue.arn
      }
    ]
  })
}

resource "aws_cloudwatch_log_group" "eventbridge_pipe_log_group" {
  #checkov:skip=CKV_AWS_338: "Ensure CloudWatch log groups retains logs for at least 1 year"
  #checkov:skip=CKV_AWS_158: "Ensure that CloudWatch Log Group is encrypted by KMS"
  name              = "/aws/pipes/${var.environment}-donation-request-pipe"
  retention_in_days = 30
}

resource "aws_iam_role" "eventbridge_pipe_role" {
  name = "${var.environment}-eventbridge-pipe-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "pipes.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy" "eventbridge_pipe_policy" {
  name = "${var.environment}-eventbridge-pipe-policy"
  role = aws_iam_role.eventbridge_pipe_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:DescribeStream",
          "dynamodb:GetRecords",
          "dynamodb:GetShardIterator",
          "dynamodb:ListStreams"
        ]
        Resource = module.database.dynamodb_table_stream_arn
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage"
        ]
        Resource = aws_sqs_queue.donor_search_queue.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.eventbridge_pipe_log_group.arn}:*"
      }
    ]
  })
}

resource "aws_pipes_pipe" "donation_request_pipe" {
  name     = "${var.environment}-donation-request-pipe"
  role_arn = aws_iam_role.eventbridge_pipe_role.arn
  source   = module.database.dynamodb_table_stream_arn
  target   = aws_sqs_queue.donor_search_queue.arn

  source_parameters {
    dynamodb_stream_parameters {
      starting_position = "LATEST"
      batch_size        = 1
    }

    filter_criteria {
      filter {
        pattern = jsonencode({
          eventName : ["INSERT", "MODIFY"],
          dynamodb : {
            NewImage : {
              PK : {
                S : [{ prefix : "BLOOD_REQ#" }]
              },
              SK : {
                S : [{ prefix : "BLOOD_REQ#" }]
              }
            }
          }
        })
      }
    }
  }

  log_configuration {
    include_execution_data = ["ALL"]
    level                  = "INFO"
    cloudwatch_logs_log_destination {
      log_group_arn = aws_cloudwatch_log_group.eventbridge_pipe_log_group.arn
    }
  }
}
