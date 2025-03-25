data "archive_file" "lambda" {
  type        = "zip"
  source_file = local.lambda_file_path
  output_path = "${local.lambda_archive_path}/${split(".", var.lambda_option.js_file_name)[0]}.zip"
}

resource "aws_lambda_function" "lambda_function" {
  #checkov:skip=CKV_AWS_173: "Check encryption settings for Lambda environmental variable"
  function_name    = "${var.environment}-${var.lambda_option.name}"
  filename         = data.archive_file.lambda.output_path
  source_code_hash = filemd5(local.lambda_file_path)
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
