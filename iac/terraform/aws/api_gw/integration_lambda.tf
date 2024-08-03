resource "aws_api_gateway_integration" "lambda_integration" {
  count = var.enable_lambda_integration ? length(var.methods) : 0

  rest_api_id             = var.rest_api_id
  resource_id             = element(coalescelist(aws_api_gateway_resource.api_path.*.id, [var.parent_api_id]), 0)
  http_method             = element(aws_api_gateway_method.methods.*.http_method, count.index)
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = "arn:aws:apigateway:${var.region}:lambda:path/2015-03-31/functions/${var.lambda_function_arn}:$LATEST/invocations"

  credentials      = var.enable_lambda_integration ? aws_iam_role.lambda_invoke_role[0].arn : ""
  content_handling = "CONVERT_TO_BINARY"
}

resource "aws_iam_role" "lambda_invoke_role" {
  count = var.enable_lambda_integration ? 1 : 0

  name               = format("%.64s", "${element(coalescelist(aws_api_gateway_resource.api_path.*.id, [var.parent_api_id]), 0)}-invoke-role")
  assume_role_policy = data.aws_iam_policy_document.api_gw_assume_role_policy.json
}

resource "aws_iam_role_policy" "lambda_invoke_role_policy" {
  count = var.enable_lambda_integration ? 1 : 0

  name   = "lambda-invoke-policy"
  role   = aws_iam_role.lambda_invoke_role[count.index].id
  policy = data.aws_iam_policy_document.lambda_api_gw_invoke_policy.json
}
