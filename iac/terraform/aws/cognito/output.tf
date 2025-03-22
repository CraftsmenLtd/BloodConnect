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

output "monitoring_user_pool_app_client_id" {
  value = aws_cognito_user_pool_client.monitoring_pool_client.id
}

output "maintainers_role" {
  value = aws_iam_role.maintainers_role.name
}

output "identity_pool_id" {
  value = aws_cognito_identity_pool.maintainers.id
}
