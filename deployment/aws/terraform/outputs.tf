output "aws_invoke_base_url" {
  value = module.aws.invoke_base_url
}

output "aws_user_pool_id" {
  value = module.aws.user_pool_id
}

output "aws_user_pool_client_id" {
  value = module.aws.user_pool_client_id
}

output "aws_cognito_custom_domain_name" {
  value = module.aws.aws_cognito_custom_domain_name
}

output "aws_api_domain_url" {
  value = module.aws.aws_api_domain_url
}
