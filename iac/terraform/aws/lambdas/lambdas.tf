resource "aws_lambda_function" "lambda_functions" {
  #checkov:skip=CKV_AWS_173: "Check encryption settings for Lambda environmental variable"
  for_each         = var.lambda_options
  function_name    = "${var.environment}-${each.value.name}-lambda"
  filename         = each.value.zip_path
  source_code_hash = filebase64sha256(each.value.zip_path)
  handler          = each.value.handler
  role             = aws_iam_role.lambda_roles[each.key].arn
  runtime          = var.lambda_runtime
  timeout          = lookup(each.value, "timeout", 60)
  memory_size      = lookup(each.value, "memory_size", 128)
  architectures    = var.lambda_architecture


  environment {
    variables = lookup(each.value, "env_variables", {})
  }

  lifecycle {
    create_before_destroy = true
  }
}
