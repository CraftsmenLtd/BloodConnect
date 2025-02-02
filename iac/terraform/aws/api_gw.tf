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

  triggers = {
    directory_md5 = sha1(join("", [for f in fileset(var.openapi_directory, "**") : filesha1("${var.openapi_directory}/${f}")]))
  }
}

resource "aws_iam_role" "api_gw_role" {
  name               = "${var.environment}-api-gateway-role"
  assume_role_policy = data.aws_iam_policy_document.api_gw_policy.json

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_iam_policy" "api_gw_dynamodb_policy" {
  name        = "${var.environment}-api-gw-dynamodb-policy"
  description = "Policy allowing API Gateway to query DynamoDB tables"
  policy      = data.aws_iam_policy_document.api_gw_dynamodb_policy.json
}

data "aws_iam_policy_document" "api_gw_dynamodb_policy" {
  statement {
    actions = [
      "dynamodb:Query",
      "dynamodb:GetItem",
      "dynamodb:UpdateItem",
    ]
    effect = "Allow"
    resources = [
      module.database.dynamodb_table_arn,
      "${module.database.dynamodb_table_arn}/index/LSI1",
      "${module.database.dynamodb_table_arn}/index/GSI1",
    ]
  }
}

resource "aws_iam_role_policy_attachment" "api_gw_dynamodb_policy_attachment" {
  role       = aws_iam_role.api_gw_role.name
  policy_arn = aws_iam_policy.api_gw_dynamodb_policy.arn
}
resource "aws_iam_role_policy_attachment" "api_gw_policy_attachment" {
  role       = aws_iam_role.api_gw_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
}

resource "aws_cloudwatch_log_group" "api_gateway_logs" {
  #checkov:skip=CKV_AWS_338: "Ensure CloudWatch log groups retains logs for at least 1 year"
  #checkov:skip=CKV_AWS_158: "Ensure that CloudWatch Log Group is encrypted by KMS"
  name              = "/aws/api-gateway/${var.environment}-api"
  retention_in_days = 60
}

resource "aws_api_gateway_account" "main" {
  cloudwatch_role_arn = aws_iam_role.api_gw_role.arn
  depends_on          = [aws_cloudwatch_log_group.api_gateway_logs]
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
