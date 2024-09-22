resource "aws_route53_record" "root" {
  zone_id = var.route53_hosted_zone_id
  name    = local.web-client-domain
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.cdn.domain_name
    zone_id                = aws_cloudfront_distribution.cdn.hosted_zone_id
    evaluate_target_health = false
  }
}
