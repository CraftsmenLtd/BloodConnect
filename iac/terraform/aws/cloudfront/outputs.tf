output "cloudfront_cdn_domain_name" {
  value = aws_cloudformation_stack.cdn.outputs["CloudFrontCdnDomainName"]
}

output "cloudfront_cdn_hosted_zone_id" {
  value = "Z2FDTNDATAQYW2"
}
