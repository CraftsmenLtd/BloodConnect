locals {
  ENVIRONMENT = {
    PROD  = "prod"
  }
  
  web-client-domain = var.environment == local.ENVIRONMENT.PROD ? var.bloodconnect_domain : "${var.environment}.${var.bloodconnect_domain}"
}
