output "cloudfront_domain_name" {
  value = aws_cloudfront_distribution.cdn.domain_name
}

output "api_gateway_domain_name" {
  value = aws_apigatewayv2_domain_name.subdomain_custom_domain.domain_name_configuration[0].target_domain_name
}