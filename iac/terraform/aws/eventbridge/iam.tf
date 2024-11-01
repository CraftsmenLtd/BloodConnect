data "aws_iam_policy_document" "eventbridge_pipe_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["pipes.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "eventbridge_pipe_role" {
  name               = "${var.environment}-eventbridge-pipe-role"
  assume_role_policy = data.aws_iam_policy_document.eventbridge_pipe_assume_role.json
}

data "aws_iam_policy_document" "eventbridge_pipe_policy_doc" {
  statement {
    effect = "Allow"
    actions = [
      "dynamodb:DescribeStream",
      "dynamodb:GetRecords",
      "dynamodb:GetShardIterator",
      "dynamodb:ListStreams"
    ]
    resources = [var.dynamodb_table_stream_arn]
  }
  statement {
    effect    = "Allow"
    actions   = ["sqs:SendMessage"]
    resources = [var.donor_search_queue_arn]
  }
  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = ["${aws_cloudwatch_log_group.eventbridge_pipe_log_group.arn}:*"]
  }
}

resource "aws_iam_role_policy" "eventbridge_pipe_policy" {
  name   = "${var.environment}-eventbridge-pipe-policy"
  role   = aws_iam_role.eventbridge_pipe_role.id
  policy = data.aws_iam_policy_document.eventbridge_pipe_policy_doc.json
}