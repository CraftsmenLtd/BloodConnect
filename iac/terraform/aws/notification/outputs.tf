output "lambda_metadata" {
  description = "Metadata for notification lambdas"
  value = [
    for key, option in local.lambda_options : {
      lambda_function_name       = module.lambda[key].lambda_function_name
      lambda_invoke_arn          = module.lambda[key].lambda_invoke_arn
      invocation_arn_placeholder = try(option.invocation_arn_placeholder, null)
    } if try(option.invocation_arn_placeholder, null) != null
  ]
}

output "push_notification_queue" {
  value = aws_sqs_queue.push_notification_queue
}
