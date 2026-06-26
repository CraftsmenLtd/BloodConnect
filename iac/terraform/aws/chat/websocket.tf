resource "aws_apigatewayv2_api" "chat" {
  name                       = "${var.environment}-chat-websocket"
  protocol_type              = "WEBSOCKET"
  route_selection_expression = "$request.body.action"
}

# --- Integrations (AWS_PROXY to the WebSocket lambdas) ---

resource "aws_apigatewayv2_integration" "connect" {
  api_id             = aws_apigatewayv2_api.chat.id
  integration_type   = "AWS_PROXY"
  integration_method = "POST"
  integration_uri    = module.lambda["chat-connect"].lambda_invoke_arn
}

resource "aws_apigatewayv2_integration" "disconnect" {
  api_id             = aws_apigatewayv2_api.chat.id
  integration_type   = "AWS_PROXY"
  integration_method = "POST"
  integration_uri    = module.lambda["chat-disconnect"].lambda_invoke_arn
}

resource "aws_apigatewayv2_integration" "send_message" {
  api_id             = aws_apigatewayv2_api.chat.id
  integration_type   = "AWS_PROXY"
  integration_method = "POST"
  integration_uri    = module.lambda["chat-send-message"].lambda_invoke_arn
}

# --- Cognito JWT lambda authorizer (REQUEST type; WebSocket has no native JWT authorizer) ---

resource "aws_apigatewayv2_authorizer" "chat_connect" {
  api_id          = aws_apigatewayv2_api.chat.id
  authorizer_type = "REQUEST"
  authorizer_uri  = module.lambda["chat-authorizer"].lambda_invoke_arn
  # Token carried as a query string param: WebSocket clients cannot set headers on $connect.
  identity_sources = ["route.request.querystring.token"]
  name             = "${var.environment}-chat-connect-authorizer"
  # 0 disables result caching, so every $connect re-validates the JWT (catches expired/revoked
  # tokens immediately; $connect is infrequent so the per-connection cost is negligible).
  authorizer_result_ttl_in_seconds = 0
}

# --- Routes ---

resource "aws_apigatewayv2_route" "connect" {
  api_id             = aws_apigatewayv2_api.chat.id
  route_key          = "$connect"
  authorization_type = "CUSTOM"
  authorizer_id      = aws_apigatewayv2_authorizer.chat_connect.id
  target             = "integrations/${aws_apigatewayv2_integration.connect.id}"
}

resource "aws_apigatewayv2_route" "disconnect" {
  api_id    = aws_apigatewayv2_api.chat.id
  route_key = "$disconnect"
  target    = "integrations/${aws_apigatewayv2_integration.disconnect.id}"
}

resource "aws_apigatewayv2_route" "send_message" {
  api_id    = aws_apigatewayv2_api.chat.id
  route_key = "sendMessage"
  target    = "integrations/${aws_apigatewayv2_integration.send_message.id}"
}

# --- Deployment + stage (WebSocket APIs use explicit deployments, not auto_deploy) ---

resource "aws_apigatewayv2_deployment" "chat" {
  api_id = aws_apigatewayv2_api.chat.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_apigatewayv2_route.connect.id,
      aws_apigatewayv2_route.disconnect.id,
      aws_apigatewayv2_route.send_message.id,
      aws_apigatewayv2_integration.connect.id,
      aws_apigatewayv2_integration.disconnect.id,
      aws_apigatewayv2_integration.send_message.id,
      aws_apigatewayv2_authorizer.chat_connect.id
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [
    aws_apigatewayv2_route.connect,
    aws_apigatewayv2_route.disconnect,
    aws_apigatewayv2_route.send_message
  ]
}

resource "aws_apigatewayv2_stage" "chat" {
  api_id        = aws_apigatewayv2_api.chat.id
  name          = var.environment
  deployment_id = aws_apigatewayv2_deployment.chat.id
}

# --- Permissions for API Gateway to invoke the lambdas ---

resource "aws_lambda_permission" "connect" {
  statement_id  = "AllowWebSocketInvokeConnect"
  action        = "lambda:InvokeFunction"
  function_name = module.lambda["chat-connect"].lambda_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.chat.execution_arn}/*/*"
}

resource "aws_lambda_permission" "disconnect" {
  statement_id  = "AllowWebSocketInvokeDisconnect"
  action        = "lambda:InvokeFunction"
  function_name = module.lambda["chat-disconnect"].lambda_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.chat.execution_arn}/*/*"
}

resource "aws_lambda_permission" "send_message" {
  statement_id  = "AllowWebSocketInvokeSendMessage"
  action        = "lambda:InvokeFunction"
  function_name = module.lambda["chat-send-message"].lambda_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.chat.execution_arn}/*/*"
}

resource "aws_lambda_permission" "authorizer" {
  statement_id  = "AllowWebSocketInvokeAuthorizer"
  action        = "lambda:InvokeFunction"
  function_name = module.lambda["chat-authorizer"].lambda_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.chat.execution_arn}/authorizers/*"
}
