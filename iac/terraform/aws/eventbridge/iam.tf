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
      "dynamodb:ListStreams",
      "dynamodb:DeleteItem"
    ]
    resources = [var.dynamodb_table_stream_arn]
  }
  statement {
    effect    = "Allow"
    actions   = ["sqs:SendMessage"]
    resources = [var.donation_request_queue_arn, var.donation_status_manager_queue_arn]
  }
  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = [
      "${aws_cloudwatch_log_group.donation_request_pipe_log_group.arn}:*",
      "${aws_cloudwatch_log_group.donation_accept_pipe_log_group.arn}:*"
    ]
  }
}

resource "aws_iam_role_policy" "eventbridge_pipe_policy" {
  name   = "${var.environment}-eventbridge-pipe-policy"
  role   = aws_iam_role.eventbridge_pipe_role.id
  policy = data.aws_iam_policy_document.eventbridge_pipe_policy_doc.json
}

data "aws_iam_policy_document" "eventbridge_scheduler_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["scheduler.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "eventbridge_scheduler_role" {
  name               = "${var.environment}-eventbridge-scheduler-role"
  assume_role_policy = data.aws_iam_policy_document.eventbridge_scheduler_assume_role.json

  tags = {
    Name = "${var.environment}-eventbridge-scheduler-role"
  }
}

data "aws_iam_policy_document" "eventbridge_scheduler_policy_doc" {
  statement {
    effect    = "Allow"
    actions   = ["lambda:InvokeFunction"]
    resources = [module.donor_search_lambda["donor-search"].lambda_function_arn]
  }
}

resource "aws_iam_role_policy" "eventbridge_scheduler_policy" {
  name   = "${var.environment}-eventbridge-scheduler-policy"
  role   = aws_iam_role.eventbridge_scheduler_role.id
  policy = data.aws_iam_policy_document.eventbridge_scheduler_policy_doc.json
}

resource "aws_lambda_permission" "allow_eventbridge_scheduler_donor_search" {
  statement_id  = "AllowExecutionFromEventBridgeScheduler"
  action        = "lambda:InvokeFunction"
  function_name = module.donor_search_lambda["donor-search"].lambda_function_name
  principal     = "scheduler.amazonaws.com"
  source_arn    = "arn:aws:scheduler:${data.aws_region.current.name}:${data.aws_account_id.current.account_id}:schedule/*"
}
