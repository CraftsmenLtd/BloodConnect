locals {
  lambda_options = {
    refresh-token = {
      name     = "refresh-token"
      zip_path = "${path.module}/../../../../core/services/aws/.build/zips/refreshToken.zip"
      policy   = data.aws_iam_policy_document.lambda_common_policy
      handler  = "refreshToken.default"
      env_variables = {
        foo = "bar"
      }
    }
  }
}

resource "aws_lambda_function" "lambda_functions" {
  for_each         = local.lambda_options
  function_name    = "${var.environment}-${each.value.name}-lambda"
  filename         = each.value.zip_path
  source_code_hash = filebase64sha256(each.value.zip_path)
  handler          = each.value.handler
  role             = aws_iam_role.lambda_roles[each.key].arn
  runtime          = var.lambda_runtime
  timeout          = lookup(each.value, "timeout", 60)
  memory_size      = lookup(each.value, "memory_size", 128)

  environment {
    variables = lookup(each.value, "env_variables", {})
  }

  lifecycle {
    create_before_destroy = true
  }
}
