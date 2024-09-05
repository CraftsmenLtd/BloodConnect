output "lambda_invoke_arns" {
  value = {
    for option in local.lambda_options :
    option.invocation_arn_placeholder => module.lambda[option.name].lambda_invoke_arn
  }
}
