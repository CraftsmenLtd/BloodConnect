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
  name              = "/aws/step-functions/${var.environment}-donor-search-sf-logs"
  retention_in_days = 90
}

resource "aws_iam_policy" "step_function_logging_policy" {
  name        = "${var.environment}-donor-search-sf-logging-policy"
  description = "Policy to allow Step Functions to write logs to CloudWatch"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogDelivery",
        "logs:GetLogDelivery",
        "logs:UpdateLogDelivery",
        "logs:DeleteLogDelivery",
        "logs:ListLogDeliveries",
        "logs:PutResourcePolicy",
        "logs:DescribeResourcePolicies",
        "logs:DescribeLogGroups"
      ],
      "Resource": "*"
    }
  ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "attach_logging_policy" {
  policy_arn = aws_iam_policy.step_function_logging_policy.arn
  role       = aws_iam_role.step_function_role.name
}

resource "aws_sfn_state_machine" "donor_search_state_machine" {
  name     = "${var.environment}-donor-search-sf"
  role_arn = aws_iam_role.step_function_role.arn

  definition = file("${path.module}/doner_search_sf.json")

  logging_configuration {
    level                  = "ALL"
    include_execution_data = true
    log_destination        = "${aws_cloudwatch_log_group.donor_search_state_machine_logs.arn}:*"
  }

  tracing_configuration {
    enabled = true
  }
}
