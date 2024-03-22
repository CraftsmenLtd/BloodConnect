resource "aws_api_gateway_integration" "s3_integration" {
  count = var.enable_s3_integration ? length(var.methods) : 0

  rest_api_id             = var.rest_api_id
  resource_id             = element(coalescelist(aws_api_gateway_resource.api_path.*.id, [var.parent_api_id]), 0)
  http_method             = element(aws_api_gateway_method.methods.*.http_method, count.index)
  type                    = "AWS"
  integration_http_method = "GET"

  uri = "arn:aws:apigateway:${var.region}:s3:path/${var.s3_integration_bucket}/${var.s3_integration_prefix}"

  credentials          = var.s3_integration_role
  passthrough_behavior = "WHEN_NO_MATCH"

  request_parameters = {
    "integration.request.path.object" = "method.request.path.item"
  }
}

resource "aws_api_gateway_method_response" "int_s3_200" {
  count = var.enable_s3_integration ? length(var.methods) : 0

  rest_api_id = var.rest_api_id
  resource_id = aws_api_gateway_resource.api_path[count.index].id
  http_method = element(aws_api_gateway_method.methods.*.http_method, count.index)
  status_code = "200"

  response_parameters = {
    "method.response.header.Content-Type"   = true
    "method.response.header.Content-Length" = true
  }
}

resource "aws_api_gateway_integration_response" "int_s3_integration_response" {
  count = var.enable_s3_integration ? length(var.methods) : 0

  rest_api_id = var.rest_api_id
  resource_id = aws_api_gateway_resource.api_path[0].id
  http_method = element(aws_api_gateway_method.methods.*.http_method, count.index)
  status_code = aws_api_gateway_method_response.int_s3_200[count.index].status_code

  response_parameters = {
    "method.response.header.Content-Type"   = "integration.response.header.Content-Type"
    "method.response.header.Content-Length" = "integration.response.header.Content-Length"
  }
}
