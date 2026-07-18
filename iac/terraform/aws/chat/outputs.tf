output "chat_websocket_api_id" {
  value = aws_apigatewayv2_api.chat.id
}

output "chat_websocket_endpoint" {
  value = aws_apigatewayv2_stage.chat.invoke_url
}

output "chat_websocket_stage_name" {
  value = aws_apigatewayv2_stage.chat.name
}

# Only the REST chat lambdas (those with an invocation_arn_placeholder) are exposed to the
# REST API Gateway: they need an invoke permission and an OpenAPI integration ARN substitution.
# The WS/pipe lambdas are wired by the WebSocket API and EventBridge pipes, not here.
output "lambda_metadata" {
  value = [
    for key, option in local.lambda_options : {
      lambda_function_name       = module.lambda[key].lambda_function_name
      lambda_invoke_arn          = module.lambda[key].lambda_invoke_arn
      invocation_arn_placeholder = option.invocation_arn_placeholder
    }
    if try(option.invocation_arn_placeholder, null) != null
  ]
}
