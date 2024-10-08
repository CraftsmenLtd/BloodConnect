resource "aws_iam_role" "lambda_role" {
  name               = "${var.environment}-${var.lambda_option.name}-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role_policy.json

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_iam_role_policy" "lambda_role_policy" {
  role   = aws_iam_role.lambda_role.id
  policy = data.aws_iam_policy_document.lambda_policy.json

  lifecycle {
    create_before_destroy = true
  }
}
