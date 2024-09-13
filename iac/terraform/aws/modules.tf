module "auth" {
  source      = "./auth"
  environment = var.environment
}

module "web-client" {
  source      = "./web-client"
  environment = var.environment
}
