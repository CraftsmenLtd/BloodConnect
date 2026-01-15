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
    actions   = ["lambda:InvokeFunction"]
    resources = [
      local.donation_request_initiator_lambda_arn,
      local.donation_status_manager_lambda_arn
    ]
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

# EventBridge Scheduler role to invoke donor_search lambda
data "aws_iam_policy_document" "eventbridge_scheduler_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["scheduler.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "aws:SourceAccount"
      values   = [data.aws_caller_identity.current.account_id]
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
    resources = [local.donor_search_lambda_arn]
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
  function_name = local.donor_search_lambda_name
  principal     = "scheduler.amazonaws.com"
  source_arn    = "arn:aws:scheduler:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:schedule/*"
}

resource "aws_lambda_permission" "allow_eventbridge_pipe_donation_request_initiator" {
  statement_id  = "AllowExecutionFromEventBridgePipe"
  action        = "lambda:InvokeFunction"
  function_name = local.donation_request_initiator_lambda_name
  principal     = "pipes.amazonaws.com"
  source_arn    = aws_pipes_pipe.donation_request_pipe.arn
}

resource "aws_lambda_permission" "allow_eventbridge_pipe_donation_status_manager_accept" {
  statement_id  = "AllowExecutionFromDonationAcceptPipe"
  action        = "lambda:InvokeFunction"
  function_name = local.donation_status_manager_lambda_name
  principal     = "pipes.amazonaws.com"
  source_arn    = aws_pipes_pipe.donation_accept_pipe.arn
}

resource "aws_lambda_permission" "allow_eventbridge_pipe_donation_status_manager_ignore" {
  statement_id  = "AllowExecutionFromDonationIgnorePipe"
  action        = "lambda:InvokeFunction"
  function_name = local.donation_status_manager_lambda_name
  principal     = "pipes.amazonaws.com"
  source_arn    = aws_pipes_pipe.donation_ignore_pipe.arn
}
