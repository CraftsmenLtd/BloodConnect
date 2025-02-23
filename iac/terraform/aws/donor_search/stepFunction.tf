data "aws_iam_policy_document" "step_function_assume_role_policy" {
  version = "2012-10-17"

  statement {
    sid     = "StepFunctionAssume"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["states.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "step_function_role" {
  name               = "${var.environment}-donor-search-sf-role"
  assume_role_policy = data.aws_iam_policy_document.step_function_assume_role_policy.json
}

resource "aws_cloudwatch_log_group" "donor_search_state_machine_logs" {
  #checkov:skip=CKV_AWS_338: "Ensure CloudWatch log groups retains logs for at least 1 year"
  #checkov:skip=CKV_AWS_158: "Ensure that CloudWatch Log Group is encrypted by KMS"
  name              = "/aws/vendedlogs/states/${var.environment}-donor-search-sf-logs"
  retention_in_days = 90
}

resource "aws_iam_role_policy_attachment" "step_function_attach_policy" {
  policy_arn = aws_iam_policy.step_function_policy.arn
  role       = aws_iam_role.step_function_role.name
}

resource "aws_iam_policy" "step_function_policy" {
  name        = "${var.environment}-donor-search-sf-policy"
  description = "Policy to allow Step Functions to write logs to CloudWatch"
  policy      = data.aws_iam_policy_document.step_function_policy_document.json
}

data "aws_iam_policy_document" "step_function_policy_document" {
  statement {
    actions = [
      "dynamodb:Query",
      "dynamodb:GetItem"
    ]
    effect = "Allow"
    resources = [
      var.dynamodb_table_arn,
      "${var.dynamodb_table_arn}/index/LSI1",
      "${var.dynamodb_table_arn}/index/GSI1"
    ]
  }

  statement {
    actions = [
      "logs:CreateLogDelivery",
      "logs:GetLogDelivery",
      "logs:UpdateLogDelivery",
      "logs:DeleteLogDelivery",
      "logs:ListLogDeliveries",
      "logs:PutResourcePolicy",
      "logs:DescribeResourcePolicies",
      "logs:DescribeLogGroups"
    ]
    effect    = "Allow"
    resources = ["*"]
  }

  statement {
    actions = [
      "sqs:sendmessage"
    ]
    effect = "Allow"
    resources = [
      aws_sqs_queue.donor_search_retry_queue.arn,
      var.push_notification_queue.arn
    ]
  }

  statement {
    actions = ["lambda:InvokeFunction"]
    effect  = "Allow"
    resources = [
      module.step_function_lambda["calculate-donors-to-notify"].lambda_arn,
      module.step_function_lambda["query-eligible-donors"].lambda_arn
    ]
  }

  statement {
    actions = ["execute-api:Invoke"]
    effect  = "Allow"
    resources = [
      "${var.api_gateway_execution_arn}/*"
    ]
  }
}

resource "aws_sfn_state_machine" "donor_search_state_machine" {
  name     = "${var.environment}-donor-search-sf"
  role_arn = aws_iam_role.step_function_role.arn

  definition = templatefile("${path.module}/donor_search.json", {
    DONOR_CALCULATE_LAMBDA_ARN       = module.step_function_lambda["calculate-donors-to-notify"].lambda_arn
    QUERY_ELIGIBLE_DONORS_LAMBDA_ARN = module.step_function_lambda["query-eligible-donors"].lambda_arn
    DYNAMODB_TABLE_NAME              = split("/", var.dynamodb_table_arn)[1]
    DONOR_SEARCH_RETRY_QUEUE_URL     = aws_sqs_queue.donor_search_retry_queue.url
    NOTIFICATION_QUEUE_URL           = var.push_notification_queue.url
  })

  logging_configuration {
    level                  = "ALL"
    include_execution_data = true
    log_destination        = "${aws_cloudwatch_log_group.donor_search_state_machine_logs.arn}:*"
  }

  tracing_configuration {
    enabled = true
  }
}
