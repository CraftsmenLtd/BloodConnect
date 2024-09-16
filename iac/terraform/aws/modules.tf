module "auth" {
  source      = "./auth"
  environment = var.environment
}

module "web-client" {
  source      = "./web-client"
  environment = var.environment
  acm_certificate_arn = data.aws_acm_certificate.certificate.arn
  bloodconnect_domain = var.bloodconnect_domain
}
