resource "aws_api_gateway_resource" "api_path" {
  count = var.api_path == "" ? 0 : 1

  rest_api_id = var.rest_api_id
  parent_id = var.parent_api_id
  path_part = var.api_path
}

resource "aws_api_gateway_method" "methods" {
  count = length(var.methods)

  rest_api_id = var.rest_api_id
  resource_id = element(coalescelist(aws_api_gateway_resource.api_path.*.id, [var.parent_api_id]), 0)

  http_method = element(var.methods, count.index)
  authorization = "NONE"
  api_key_required = var.api_key_required

  request_models = {
    "application/json" = "Empty"
  }

  request_parameters = var.method_request_params
}
