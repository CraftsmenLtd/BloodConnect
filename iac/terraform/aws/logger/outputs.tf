output "lambda_metadata" {
  value = [
    for option in local.lambda_options : {
      lambda_function_name       = module.lambda[option.name].lambda_function_name
      lambda_invoke_arn          = module.lambda[option.name].lambda_invoke_arn
      invocation_arn_placeholder = option.invocation_arn_placeholder
    }
  ]
}
