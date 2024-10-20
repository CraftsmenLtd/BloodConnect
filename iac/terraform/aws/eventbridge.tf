resource "aws_cloudwatch_event_rule" "donation_request_rule" {
  name        = "${var.environment}-donation-request-rule"
  description = "Capture blood donation request creations and updates"

  event_pattern = jsonencode({
    source      = ["aws.dynamodb"]
    detail-type = ["AWS DynamoDB Stream Event"]
    detail = {
      eventName = ["INSERT", "MODIFY"]
      dynamodb = {
        Keys = {
          PK = {
            S = [{ prefix = "BLOOD_REQ#" }]
          }
        }
      }
    }
  })
}

resource "aws_sqs_queue" "donor_search_queue" {
  name                      = "${var.environment}-donor-search-queue"
  delay_seconds             = 0
  max_message_size          = 262144
  message_retention_seconds = 86400
  receive_wait_time_seconds = 10
}

resource "aws_cloudwatch_event_target" "donor_search_queue_target" {
  rule      = aws_cloudwatch_event_rule.donation_request_rule.name
  target_id = "DonorSearchQueue"
  arn       = aws_sqs_queue.donor_search_queue.arn
}

resource "aws_sqs_queue_policy" "donor_search_queue_policy" {
  queue_url = aws_sqs_queue.donor_search_queue.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowEventBridgeSendMessage"
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action   = "sqs:SendMessage"
        Resource = aws_sqs_queue.donor_search_queue.arn
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_cloudwatch_event_rule.donation_request_rule.arn
          }
        }
      }
    ]
  })
}

resource "aws_cloudwatch_log_group" "eventbridge_log_group" {
  name = "/aws/events/${aws_cloudwatch_event_rule.donation_request_rule.name}"
}

resource "aws_cloudwatch_event_target" "log_group_target" {
  rule      = aws_cloudwatch_event_rule.donation_request_rule.name
  target_id = "SendToCloudWatchLogs"
  arn       = aws_cloudwatch_log_group.eventbridge_log_group.arn
}

resource "aws_iam_role" "eventbridge_cloudwatch_role" {
  name = "${var.environment}-eventbridge-cloudwatch-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "eventbridge_cloudwatch_policy" {
  name = "${var.environment}-eventbridge-cloudwatch-policy"
  role = aws_iam_role.eventbridge_cloudwatch_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.eventbridge_log_group.arn}:*"
      }
    ]
  })
}

resource "aws_iam_role" "eventbridge_role" {
  name = "${var.environment}-eventbridge-dynamodb-stream-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "events.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy" "eventbridge_policy" {
  name = "${var.environment}-eventbridge-dynamodb-stream-policy"
  role = aws_iam_role.eventbridge_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetRecords",
          "dynamodb:GetShardIterator",
          "dynamodb:DescribeStream",
          "dynamodb:ListStreams"
        ]
        Resource = module.database.dynamodb_table_stream_arn
      }
    ]
  })
}
