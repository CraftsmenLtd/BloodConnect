module "auth" {
  source                  = "./auth"
  environment             = var.environment
  api_gw_rest_api_id      = aws_api_gateway_rest_api.rest_api.id
}
