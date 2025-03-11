output "user_pool_arn" {
  value = aws_cognito_user_pool.user_pool.arn
}

output "aws_cognito_custom_domain_name" {
  value = local.cognito_domain_name
}

output "aws_cognito_custom_domain_cloudfront_distribution" {
  value = aws_cognito_user_pool_domain.custom_domain.cloudfront_distribution
}

output "aws_cognito_custom_domain_cloudfront_distribution_zone_id" {
  value = aws_cognito_user_pool_domain.custom_domain.cloudfront_distribution_zone_id
}

output "user_pool_id" {
  value = aws_cognito_user_pool.user_pool.id
}

output "user_pool_client_id" {
  value = aws_cognito_user_pool_client.app_pool_client.id
}
