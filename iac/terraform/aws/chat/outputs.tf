output "lambda_metadata" {
  value = [
    for key, option in local.lambda_options : {
      lambda_function_name       = module.lambda[key].lambda_function_name
      lambda_invoke_arn          = module.lambda[key].lambda_invoke_arn
      invocation_arn_placeholder = option.invocation_arn_placeholder
    }
  ]
}

output "chat_websocket_url" {
  value = aws_apigatewayv2_stage.chat_ws.invoke_url
}
