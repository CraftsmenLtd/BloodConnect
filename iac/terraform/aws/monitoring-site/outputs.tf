output "site_bucket" {
  description = "The monitoring site S3 bucket"
  value       = aws_s3_bucket.monitoring_site
}

output "donation_request_lambda_arn" {
  description = "The donation request monitoring lambda arn"
  value       = module.lambda.lambda_arn
}
