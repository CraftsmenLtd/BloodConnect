resource "aws_api_gateway_rest_api" "rest_api" {
  name        = "${var.environment}-api"
  description = "BloodConnect API"
  binary_media_types = [
    "application/binary",
    "application/bxf+xml",
  ]
  body = data.template_file.openapi_definition.rendered

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_usage_plan" "api_usage_plan" {
  name = "${var.environment}-api-usage-plan"

  api_stages {
    api_id = aws_api_gateway_rest_api.rest_api.id
    stage  = aws_api_gateway_deployment.api_deployment.stage_name
  }
}

resource "aws_api_gateway_deployment" "api_deployment" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  stage_name  = "api"

  depends_on = [
    null_resource.update_and_import_open_api_script
  ]

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_iam_role" "api_gw_cloudwatch_role" {
  name               = "${var.environment}-api-gw-cloudwatch-role"
  assume_role_policy = data.aws_iam_policy_document.api_gw_policy.json

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_iam_role_policy_attachment" "api_gw_policy_attachment" {
  role       = aws_iam_role.api_gw_cloudwatch_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
}

resource "aws_api_gateway_account" "main" {
  cloudwatch_role_arn = aws_iam_role.api_gw_cloudwatch_role.arn
}

resource "aws_api_gateway_method_settings" "api_gw_settings" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id
  stage_name  = aws_api_gateway_deployment.api_deployment.stage_name
  method_path = "*/*"

  settings {
    caching_enabled      = true
    metrics_enabled      = false
    logging_level        = "INFO"
    cache_data_encrypted = true
    data_trace_enabled   = false
  }
}

resource "aws_lambda_permission" "lambda_invoke_permission" {
  for_each = {
    for lambda in local.all_lambda_metadata : lambda.lambda_function_name => lambda
  }

  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = each.value.lambda_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.rest_api.execution_arn}/*/*"
}


resource "aws_api_gateway_usage_plan" "blood_donation_request_usage_plan" {
  name        = "${var.environment}-blood-donation-request-usage-plan"
  description = "Usage plan for blood donation requests"

  api_stages {
    api_id = aws_api_gateway_rest_api.rest_api.id
    stage  = aws_api_gateway_deployment.api_deployment.stage_name
  }

  quota_settings {
    limit  = 10
    offset = 0
    period = "DAY"
  }

  throttle_settings {
    burst_limit = 5
    rate_limit  = 10
  }
}

resource "aws_api_gateway_api_key" "blood_donation_request_api_key" {
  name = "${var.environment}-blood-donation-request-api-key"
}

resource "aws_api_gateway_usage_plan_key" "blood_donation_request_usage_plan_key" {
  key_id        = aws_api_gateway_api_key.blood_donation_request_api_key.id
  key_type      = "API_KEY"
  usage_plan_id = aws_api_gateway_usage_plan.blood_donation_request_usage_plan.id
}
