resource "aws_apigatewayv2_api" "chat_ws" {
  name                       = "${var.environment}-bloodConnect-chat-ws"
  protocol_type              = "WEBSOCKET"
  route_selection_expression = "$request.body.action"
}

resource "aws_apigatewayv2_authorizer" "chat_ws" {
  api_id           = aws_apigatewayv2_api.chat_ws.id
  authorizer_type  = "REQUEST"
  authorizer_uri   = module.lambda["chat-authorizer"].lambda_invoke_arn
  identity_sources = ["route.request.querystring.token"]
  name             = "${var.environment}-chat-ws-authorizer"
}

locals {
  ws_routes = {
    "$connect"    = { lambda = "chat-connect", authorized = true }
    "$disconnect" = { lambda = "chat-disconnect", authorized = false }
    "sendMessage" = { lambda = "chat-send-message", authorized = false }
    "typing"      = { lambda = "chat-typing", authorized = false }
    "markRead"    = { lambda = "chat-mark-read", authorized = false }
    "$default"    = { lambda = "chat-send-message", authorized = false }
  }
}

resource "aws_apigatewayv2_integration" "chat_ws" {
  for_each         = local.ws_routes
  api_id           = aws_apigatewayv2_api.chat_ws.id
  integration_type = "AWS_PROXY"
  integration_uri  = module.lambda[each.value.lambda].lambda_invoke_arn
}

resource "aws_apigatewayv2_route" "chat_ws" {
  for_each           = local.ws_routes
  api_id             = aws_apigatewayv2_api.chat_ws.id
  route_key          = each.key
  target             = "integrations/${aws_apigatewayv2_integration.chat_ws[each.key].id}"
  authorization_type = each.value.authorized ? "CUSTOM" : "NONE"
  authorizer_id      = each.value.authorized ? aws_apigatewayv2_authorizer.chat_ws.id : null
}

resource "aws_cloudwatch_log_group" "chat_ws" {
  #checkov:skip=CKV_AWS_158: "Ensure that CloudWatch Log Group is encrypted by KMS"
  name              = "/aws/apigateway/${var.environment}-bloodConnect-chat-ws"
  retention_in_days = var.log_retention_in_days
}

resource "aws_apigatewayv2_stage" "chat_ws" {
  api_id      = aws_apigatewayv2_api.chat_ws.id
  name        = var.environment
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.chat_ws.arn
    format = jsonencode({
      requestId = "$context.requestId"
      routeKey  = "$context.routeKey"
      status    = "$context.status"
      error     = "$context.error.message"
    })
  }

  default_route_settings {
    logging_level          = "INFO"
    data_trace_enabled     = false
    throttling_burst_limit = 50
    throttling_rate_limit  = 100
  }
}

resource "aws_lambda_permission" "chat_ws_routes" {
  for_each      = local.ws_routes
  statement_id  = "AllowWS${replace(replace(each.key, "$", ""), "/", "")}"
  action        = "lambda:InvokeFunction"
  function_name = module.lambda[each.value.lambda].lambda_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.chat_ws.execution_arn}/*/*"
}

resource "aws_lambda_permission" "chat_ws_authorizer" {
  statement_id  = "AllowWSAuthorizer"
  action        = "lambda:InvokeFunction"
  function_name = module.lambda["chat-authorizer"].lambda_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.chat_ws.execution_arn}/authorizers/*"
}
