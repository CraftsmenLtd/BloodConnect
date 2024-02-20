# auth
resource "aws_api_gateway_resource" "auth_api_resource" {
  rest_api_id = var.api_gw_rest_api_id
  parent_id   = var.api_gw_root_resource_id
  path_part   = "auth"
}

# auth/refresh-token
module "api_auth_refresh_token" {
  source = "./../api_gw"

  api_path = "refresh-token"
  methods  = ["POST"]

  region        = data.aws_region.current.name
  environment   = var.environment
  rest_api_id   = var.api_gw_rest_api_id
  parent_api_id = aws_api_gateway_resource.auth_api_resource.id

  api_key_required = false

  enable_lambda_integration = true
  lambda_function_arn       = aws_lambda_function.lambda_functions[local.lambda_options.refresh-token.name].arn
}
