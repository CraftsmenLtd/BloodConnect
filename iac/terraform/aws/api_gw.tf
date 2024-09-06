resource "aws_api_gateway_rest_api" "rest_api" {
  name        = "${var.environment}-api"
  description = "BloodConnect API"
  binary_media_types = [
    "application/binary",
    "application/bxf+xml",
  ]
  body = jsonencode(templatefile(
    var.combined_openapi_file,
    merge({
        ENVIRONMENT = var.environment
        API_VERSION = var.api_version
      },
      local.all_lambda_invoke_arns
    )
  ))

  depends_on = [
    null_resource.update_and_import_open_api_script
  ]

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
  stage_name  = var.environment

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

  source_arn = "${aws_api_gateway_rest_api.rest_api.execution_arn}/*/*"
}

#resource "aws_api_gateway_domain_name" "api_gw_domain_name" {
#  domain_name     = "${var.environment}.${var.bloodconnect_domain}"
#}
#
#resource "aws_api_gateway_base_path_mapping" "api_mapping" {
#  api_id      = aws_api_gateway_rest_api.rest_api.id
#  stage_name  = aws_api_gateway_deployment.api_deployment.stage_name
#  domain_name = aws_api_gateway_domain_name.api_gw_domain_name.domain_name
#  base_path   = "api"
#}
