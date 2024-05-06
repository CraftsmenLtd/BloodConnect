resource "aws_api_gateway_rest_api" "rest_api" {
  name        = "${var.environment}-api"
  description = "BloodConnect API"
  binary_media_types = [
    "application/binary",
    "application/bxf+xml",
  ]

  lifecycle {
    create_before_destroy = true
  }
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
