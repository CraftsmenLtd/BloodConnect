output "cloudfront_cdn_domain_name" {
  value = aws_cloudformation_stack.cdn.outputs["CloudFrontCdnDomainName"]
}
