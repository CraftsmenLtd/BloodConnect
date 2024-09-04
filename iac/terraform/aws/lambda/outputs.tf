output "openapi_placeholder" {
  value = var.lambda_option.openapi_placeholder
}

output "lambda_invoke_arn" {
  value = aws_lambda_function.lambda_function.invoke_arn
}
