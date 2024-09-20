locals {
  web-client-domain = var.environment == "prod" ? var.bloodconnect_domain : "${var.environment}.${var.bloodconnect_domain}"
}
