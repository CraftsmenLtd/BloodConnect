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
  # checkov:skip=CKV_AWS_309: Authorization is enforced once at $connect via the Cognito custom
  # authorizer; WebSocket APIs do not re-authorize per-message routes, which inherit the connection.
  api_id    = aws_apigatewayv2_api.chat.id
  route_key = "$disconnect"
  target    = "integrations/${aws_apigatewayv2_integration.disconnect.id}"
}

resource "aws_apigatewayv2_route" "send_message" {
  # checkov:skip=CKV_AWS_309: Authorization is enforced once at $connect via the Cognito custom
  # authorizer; WebSocket APIs do not re-authorize per-message routes, which inherit the connection.
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

resource "aws_cloudwatch_log_group" "chat_websocket_access" {
  #checkov:skip=CKV_AWS_338: "Ensure CloudWatch log groups retains logs for at least 1 year"
  #checkov:skip=CKV_AWS_158: "Ensure that CloudWatch Log Group is encrypted by KMS"
  name              = "/aws/apigateway/${var.environment}-chat-websocket"
  retention_in_days = 60
}

resource "aws_apigatewayv2_stage" "chat" {
  # checkov:skip=CKV2_AWS_51: Client certificate auth verifies API Gateway to an HTTP backend; the
  # chat integrations are Lambda AWS_PROXY, so mutual TLS to a backend is not applicable.
  api_id        = aws_apigatewayv2_api.chat.id
  name          = var.environment
  deployment_id = aws_apigatewayv2_deployment.chat.id

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.chat_websocket_access.arn
    format = jsonencode({
      requestId        = "$context.requestId"
      connectionId     = "$context.connectionId"
      routeKey         = "$context.routeKey"
      eventType        = "$context.eventType"
      status           = "$context.status"
      requestTime      = "$context.requestTime"
      integrationError = "$context.integrationErrorMessage"
    })
  }
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
