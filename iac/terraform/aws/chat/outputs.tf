output "chat_websocket_api_id" {
  value = aws_apigatewayv2_api.chat.id
}

output "chat_websocket_endpoint" {
  value = aws_apigatewayv2_stage.chat.invoke_url
}

output "chat_websocket_stage_name" {
  value = aws_apigatewayv2_stage.chat.name
}
