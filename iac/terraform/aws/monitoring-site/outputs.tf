output "site_bucket" {
  description = "The monitoring site S3 bucket"
  value       = aws_s3_bucket.monitoring_site
}
