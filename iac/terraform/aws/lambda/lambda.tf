resource "aws_lambda_function" "lambda_function" {
  #checkov:skip=CKV_AWS_173: "Check encryption settings for Lambda environmental variable"
  function_name    = "${var.environment}-${var.lambda_option.name}"
  filename         = "${local.lambda_archive_path}/${var.lambda_option.zip_path}"
  source_code_hash = filebase64sha256("${local.lambda_archive_path}/${var.lambda_option.zip_path}")
  handler          = var.lambda_option.handler
  role             = aws_iam_role.lambda_role.arn
  runtime          = var.lambda_runtime
  timeout          = lookup(var.lambda_option, "timeout", 60)
  memory_size      = lookup(var.lambda_option, "memory_size", 128)
  architectures    = var.lambda_architecture

  environment {
    variables = lookup(var.lambda_option, "env_variables", {})
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_cloudwatch_log_group" "lambda_log_group" {
  #checkov:skip=CKV_AWS_338: "Ensure CloudWatch log groups retains logs for at least 1 year"
  #checkov:skip=CKV_AWS_158: "Ensure that CloudWatch Log Group is encrypted by KMS"
  name              = "/aws/lambda/${aws_lambda_function.lambda_function.function_name}"
  retention_in_days = var.log_retention_in_days
}
