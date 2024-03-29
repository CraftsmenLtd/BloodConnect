resource "aws_iam_role" "lambda_roles" {
  for_each           = local.lambda_options
  name               = "${var.environment}-${each.key}-lambda-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role_policy.json

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_iam_role_policy" "lambda_role_policy" {
  for_each = local.lambda_options
  role     = aws_iam_role.lambda_roles[each.key].id
  policy   = each.value.policy.json

  lifecycle {
    create_before_destroy = true
  }
}
