# API Gateway for Main Domain (www.bloodconnect.net)
resource "aws_apigatewayv2_api" "api_main" {
  name          = "api-main-gateway"
  protocol_type = "HTTP"
  description   = "API Gateway for the main .${local.www_domain}"
}

resource "aws_apigatewayv2_domain_name" "main_custom_domain" {
  domain_name     = local.www_domain
  domain_name_configuration {
    certificate_arn = var.acm_certificate_arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }
}

resource "aws_apigatewayv2_api" "api_subdomain" {
  name          = "api-subdomain-gateway"
  protocol_type = "HTTP"
  description   = "API Gateway for the subdomain api.bloodconnect.net"
}

resource "aws_apigatewayv2_domain_name" "subdomain_custom_domain" {
  domain_name     = local.api_subdomain_name
  domain_name_configuration {
    certificate_arn = var.acm_certificate_arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }
}
