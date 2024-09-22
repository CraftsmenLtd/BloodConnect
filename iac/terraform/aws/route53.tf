data "aws_route53_zone" "main" {
  #checkov:skip=CKV2_AWS_39: "Ensure Domain Name System (DNS) query logging is enabled for Amazon Route 53 hosted zones"
  #checkov:skip=CKV2_AWS_38: "Ensure Domain Name System Security Extensions (DNSSEC) signing is enabled for Amazon Route 53 public hosted zones"
  name         = var.bloodconnect_domain
  private_zone = false
}

resource "aws_route53_record" "rest_api_record" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = aws_api_gateway_domain_name.api_domain.domain_name
  type    = "A"

  alias {
    name                   = aws_api_gateway_domain_name.api_domain.cloudfront_domain_name
    zone_id                = aws_api_gateway_domain_name.api_domain.cloudfront_zone_id
    evaluate_target_health = false
  }
}
