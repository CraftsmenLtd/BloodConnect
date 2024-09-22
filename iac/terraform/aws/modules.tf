module "auth" {
  source      = "./auth"
  environment = var.environment
}

module "web-client" {
  source                 = "./web-client"
  environment            = var.environment
  acm_certificate_arn    = data.aws_acm_certificate.certificate.arn
  bloodconnect_domain    = var.bloodconnect_domain
  route53_hosted_zone_id = data.aws_route53_zone.main.zone_id
}
