output "media_bucket" {
  value = {
    id                          = aws_s3_bucket.media.id
    arn                         = aws_s3_bucket.media.arn
    bucket_regional_domain_name = aws_s3_bucket.media.bucket_regional_domain_name
  }
}

output "media_path" {
  value = var.media_path
}
