output "static_site_bucket" {
  description = "The static site S3 bucket"
  value       = aws_s3_bucket.static_site
}

output "failover_bucket" {
  description = "The failover S3 bucket"
  value       = aws_s3_bucket.failover_bucket
}

output "log_store_bucket" {
  description = "The log store S3 bucket"
  value       = aws_s3_bucket.log_store
}
