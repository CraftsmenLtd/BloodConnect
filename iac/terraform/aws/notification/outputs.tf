output "lambda_metadata" {
  description = "Metadata for notification lambdas"
  value = [
    for key, value in local.lambda_options : {
      lambda_function_name       = module.lambda[key].lambda_function_name
      lambda_invoke_arn          = module.lambda[key].lambda_invoke_arn
      invocation_arn_placeholder = value.invocation_arn_placeholder
    }
  ]
}
