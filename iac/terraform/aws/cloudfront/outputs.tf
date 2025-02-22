output "cloudfront_cdn_domain_name" {
  value = aws_cloudfront_distribution.cdn.domain_name
}

output "cloudfront_cdn_hosted_zone_id" {
  value = aws_cloudfront_distribution.cdn.hosted_zone_id
}
