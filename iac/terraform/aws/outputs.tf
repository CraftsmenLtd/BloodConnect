output "invoke_base_url" {
  value = aws_api_gateway_deployment.api_deployment.invoke_url
}

output "rest_api_id" {
  value = aws_api_gateway_rest_api.rest_api.id
}

output "api_deployment_stage_name" {
  value = aws_api_gateway_deployment.api_deployment.stage_name
}

output "user_pool_id" {
  value = module.cognito.user_pool_id
}

output "user_pool_client_id" {
  value = module.cognito.user_pool_client_id
}

output "aws_cognito_custom_domain_name" {
  value = module.cognito.aws_cognito_custom_domain_name
}

output "aws_api_domain_url" {
  value = "https://${aws_route53_record.root.fqdn}/api"
}
