locals {
  web-client-domain = var.environment == var.PROD_ENVIRONMENT ? var.bloodconnect_domain : "${var.environment}.${var.bloodconnect_domain}"
}
