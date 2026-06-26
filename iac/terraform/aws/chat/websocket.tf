resource "aws_apigatewayv2_api" "chat_ws" {
  name                       = "${var.environment}-chat-websocket"
  protocol_type              = "WEBSOCKET"
  route_selection_expression = "$request.body.action"
}

resource "aws_apigatewayv2_authorizer" "chat" {
  api_id           = aws_apigatewayv2_api.chat_ws.id
  authorizer_type  = "REQUEST"
  authorizer_uri   = module.lambda["chat-authorizer"].lambda_invoke_arn
  identity_sources = ["route.request.querystring.token"]
  name             = "${var.environment}-chat-authorizer"
}

locals {
  chat_ws_routes = {
    connect = {
      route_key  = "$connect"
      lambda_key = "chat-connect"
    }
    disconnect = {
      route_key  = "$disconnect"
      lambda_key = "chat-disconnect"
    }
    send_message = {
      route_key  = "sendMessage"
      lambda_key = "chat-send-message"
    }
  }
}

resource "aws_apigatewayv2_integration" "chat_ws" {
  for_each           = local.chat_ws_routes
  api_id             = aws_apigatewayv2_api.chat_ws.id
  integration_type   = "AWS_PROXY"
  integration_method = "POST"
  integration_uri    = module.lambda[each.value.lambda_key].lambda_invoke_arn
}

resource "aws_apigatewayv2_route" "chat_ws" {
  # checkov:skip=CKV_AWS_309: "Only the $connect route can carry an authorizer on a WebSocket API; $disconnect and sendMessage run on a connection already authorized at $connect by the Cognito Lambda authorizer"
  for_each           = local.chat_ws_routes
  api_id             = aws_apigatewayv2_api.chat_ws.id
  route_key          = each.value.route_key
  target             = "integrations/${aws_apigatewayv2_integration.chat_ws[each.key].id}"
  authorization_type = each.value.route_key == "$connect" ? "CUSTOM" : "NONE"
  authorizer_id      = each.value.route_key == "$connect" ? aws_apigatewayv2_authorizer.chat.id : null
}

resource "aws_apigatewayv2_deployment" "chat_ws" {
  api_id     = aws_apigatewayv2_api.chat_ws.id
  depends_on = [aws_apigatewayv2_route.chat_ws, aws_apigatewayv2_integration.chat_ws]

  triggers = {
    redeployment = sha1(jsonencode([
      aws_apigatewayv2_integration.chat_ws,
      aws_apigatewayv2_route.chat_ws,
      aws_apigatewayv2_authorizer.chat
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_cloudwatch_log_group" "chat_ws_access_logs" {
  #checkov:skip=CKV_AWS_338: "Ensure CloudWatch log groups retains logs for at least 1 year"
  #checkov:skip=CKV_AWS_158: "Ensure that CloudWatch Log Group is encrypted by KMS"
  name              = "/aws/apigateway/${var.environment}-chat-websocket"
  retention_in_days = 60
}

resource "aws_apigatewayv2_stage" "chat_ws" {
  # checkov:skip=CKV2_AWS_51: "Client certificate authentication is not supported for WebSocket APIs; connections are authenticated by the Cognito Lambda authorizer on $connect"
  api_id        = aws_apigatewayv2_api.chat_ws.id
  name          = var.environment
  deployment_id = aws_apigatewayv2_deployment.chat_ws.id

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.chat_ws_access_logs.arn
    format = jsonencode({
      requestId       = "$context.requestId"
      ip              = "$context.identity.sourceIp"
      requestTime     = "$context.requestTime"
      routeKey        = "$context.routeKey"
      status          = "$context.status"
      connectionId    = "$context.connectionId"
      responseLatency = "$context.responseLatency"
    })
  }
}

resource "aws_lambda_permission" "chat_ws_routes" {
  for_each      = local.chat_ws_routes
  statement_id  = "AllowChatWsInvoke-${each.key}"
  action        = "lambda:InvokeFunction"
  function_name = module.lambda[each.value.lambda_key].lambda_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.chat_ws.execution_arn}/*/*"
}

resource "aws_lambda_permission" "chat_ws_authorizer" {
  statement_id  = "AllowChatWsAuthorizerInvoke"
  action        = "lambda:InvokeFunction"
  function_name = module.lambda["chat-authorizer"].lambda_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.chat_ws.execution_arn}/authorizers/${aws_apigatewayv2_authorizer.chat.id}"
}
