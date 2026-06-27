# API Gateway WebSocket API for in-app chat (ADR-001).
# Routes: $connect (Cognito JWT request authorizer), $disconnect, sendmessage.
# Real-time server -> client delivery uses execute-api:ManageConnections (see iam.tf);
# message routing is selected by the $request.body.action field.

resource "aws_apigatewayv2_api" "chat_websocket" {
  name                       = "${var.environment}-chat-websocket-api"
  protocol_type              = "WEBSOCKET"
  route_selection_expression = "$request.body.action"
}

# --- Integrations (Lambda proxy) ---

resource "aws_apigatewayv2_integration" "connect" {
  api_id                    = aws_apigatewayv2_api.chat_websocket.id
  integration_type          = "AWS_PROXY"
  integration_uri           = module.lambda["connect"].lambda_invoke_arn
  integration_method        = "POST"
  content_handling_strategy = "CONVERT_TO_TEXT"
  passthrough_behavior      = "WHEN_NO_MATCH"
}

resource "aws_apigatewayv2_integration" "disconnect" {
  api_id                    = aws_apigatewayv2_api.chat_websocket.id
  integration_type          = "AWS_PROXY"
  integration_uri           = module.lambda["disconnect"].lambda_invoke_arn
  integration_method        = "POST"
  content_handling_strategy = "CONVERT_TO_TEXT"
  passthrough_behavior      = "WHEN_NO_MATCH"
}

resource "aws_apigatewayv2_integration" "sendmessage" {
  api_id                    = aws_apigatewayv2_api.chat_websocket.id
  integration_type          = "AWS_PROXY"
  integration_uri           = module.lambda["sendmessage"].lambda_invoke_arn
  integration_method        = "POST"
  content_handling_strategy = "CONVERT_TO_TEXT"
  passthrough_behavior      = "WHEN_NO_MATCH"
}

# --- Request authorizer on $connect (Cognito JWT in the Authorization header, ADV-005) ---

resource "aws_apigatewayv2_authorizer" "chat_request" {
  api_id           = aws_apigatewayv2_api.chat_websocket.id
  name             = "${var.environment}-chat-ws-authorizer"
  authorizer_type  = "REQUEST"
  authorizer_uri   = module.lambda["authorizer"].lambda_invoke_arn
  identity_sources = ["route.request.header.Authorization"]
}

# --- Routes ---

resource "aws_apigatewayv2_route" "connect" {
  api_id             = aws_apigatewayv2_api.chat_websocket.id
  route_key          = "$connect"
  authorization_type = "CUSTOM"
  authorizer_id      = aws_apigatewayv2_authorizer.chat_request.id
  target             = "integrations/${aws_apigatewayv2_integration.connect.id}"
}

resource "aws_apigatewayv2_route" "disconnect" {
  api_id    = aws_apigatewayv2_api.chat_websocket.id
  route_key = "$disconnect"
  target    = "integrations/${aws_apigatewayv2_integration.disconnect.id}"
}

resource "aws_apigatewayv2_route" "sendmessage" {
  api_id    = aws_apigatewayv2_api.chat_websocket.id
  route_key = "sendmessage"
  target    = "integrations/${aws_apigatewayv2_integration.sendmessage.id}"
}

# --- Stage (auto-deploy) ---

resource "aws_apigatewayv2_stage" "chat_websocket" {
  api_id      = aws_apigatewayv2_api.chat_websocket.id
  name        = var.environment
  auto_deploy = true
}

# --- Invoke permissions for API Gateway ---

resource "aws_lambda_permission" "chat_ws_route_invoke" {
  for_each      = toset(["connect", "disconnect", "sendmessage"])
  statement_id  = "AllowChatWsInvoke-${each.key}"
  action        = "lambda:InvokeFunction"
  function_name = module.lambda[each.key].lambda_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.chat_websocket.execution_arn}/*/*"
}

resource "aws_lambda_permission" "chat_ws_authorizer_invoke" {
  statement_id  = "AllowChatWsAuthorizerInvoke"
  action        = "lambda:InvokeFunction"
  function_name = module.lambda["authorizer"].lambda_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.chat_websocket.execution_arn}/authorizers/${aws_apigatewayv2_authorizer.chat_request.id}"
}
