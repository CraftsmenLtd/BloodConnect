output "lambda_arn" {
  value = aws_lambda_function.lambda_function.arn
}

output "lambda_invoke_arn" {
  value = aws_lambda_function.lambda_function.invoke_arn
}

output "lambda_function_name" {
  value = aws_lambda_function.lambda_function.function_name
}

output "role_arn" {
  value = aws_iam_role.lambda_role.arn
}
