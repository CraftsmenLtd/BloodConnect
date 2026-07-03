output "websocket_api_endpoint" {
  description = "WSS invoke URL for the chat WebSocket API"
  value       = aws_apigatewayv2_stage.chat_ws.invoke_url
}

output "lambda_metadata" {
  description = "Invocation metadata for REST chat lambdas (history, channels) for OpenAPI substitution"
  value = [
    for key, option in local.lambda_options : {
      lambda_function_name       = module.lambda[key].lambda_function_name
      lambda_invoke_arn          = module.lambda[key].lambda_invoke_arn
      invocation_arn_placeholder = try(option.invocation_arn_placeholder, null)
    } if try(option.invocation_arn_placeholder, null) != null
  ]
}
