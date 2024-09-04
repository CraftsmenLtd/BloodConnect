
output "lambda_invoke_arns" {
  value = {
    for lambda_module in module.lambda :
    lambda_module.openapi_placeholder => lambda_module.lambda_invoke_arn
  }
}
