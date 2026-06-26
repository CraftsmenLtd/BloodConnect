# Only API Gateway-integrated lambdas (those with a placeholder) are surfaced
# for OpenAPI wiring and REST invoke permissions. Stream and websocket lambdas
# are invoked by EventBridge pipes and the websocket API respectively.
output "lambda_metadata" {
  value = [
    for key, option in local.lambda_options : {
      lambda_function_name       = module.lambda[key].lambda_function_name
      lambda_invoke_arn          = module.lambda[key].lambda_invoke_arn
      invocation_arn_placeholder = option.invocation_arn_placeholder
    }
    if option.invocation_arn_placeholder != ""
  ]
}

output "chat_websocket_url" {
  value = aws_apigatewayv2_stage.chat_ws.invoke_url
}
