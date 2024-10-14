resource "aws_sfn_state_machine" "donor_search_state_machine" {
  name     = "${var.environment}-donor-search-state-machine"
  role_arn = aws_iam_role.step_function_role.arn

    definition = <<EOF
    {
      "Comment": "State machine for donor search process",
      "StartAt": "DonorNotification",
      "States": {
        "DonorNotification": {
          "Type": "Task",
          "Resource": "${module.lambda["donor-notification-lambda"].lambda_arn}",
          "End": true
        }
      }
    }
    EOF
}

data "aws_iam_policy_document" "lambda_assume_role_policy" {
  version = "2012-10-17"

  statement {
    sid     = "LambdaAssume"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "step_function_role" {
  name = "${var.environment}-donor-search-state-machine-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role_policy.json
}


