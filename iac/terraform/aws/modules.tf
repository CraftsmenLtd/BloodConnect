module "auth" {
  source      = "./auth"
  environment = var.environment
}

module "domain_config" {
  source = "./web-client"
}