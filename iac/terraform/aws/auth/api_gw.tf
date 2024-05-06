module "auth_api" {
  source  = "terraform-aws-modules/apigateway-v2/aws"
  version = "1.8.0"

  create_api_gateway = false
  default_stage_access_log_destination_arn = aws_cloudwatch_log_group.apigateway_logs.arn
  create_default_stage                     = false
  description                              = "Auth API"
  name                                     = "${var.environment}-http-api"
  protocol_type                            = "HTTP"

  default_route_settings = {
    detailed_metrics_enabled = true
    throttling_burst_limit   = 100
    throttling_rate_limit    = 100
  }

  cors_configuration = {
    allow_origins = ["*"]
    allow_methods = ["*"]
    allow_headers = ["*"]
  }

  integrations = {
    "GET /refresh-token" = {
      lambda_arn             = aws_lambda_function.lambda_functions[local.lambda_options.refresh-token.name].arn
      payload_format_version = "2.0"
      timeout_milliseconds   = 12000
    }
  }

  depends_on = [aws_lambda_function.lambda_functions]
}

resource "aws_lambda_permission" "api_gw_lambda_execution_permission" {
  for_each = aws_lambda_function.lambda_functions
  statement_id  = "AllowAPIGW-${each.key}"
  action        = "lambda:InvokeFunction"
  function_name = each.value.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${module.auth_api.apigatewayv2_api_execution_arn}/*/*"
}