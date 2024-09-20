locals {
  web-client-domain = var.environment == "master" ? var.bloodconnect_domain : "${var.environment}.${var.bloodconnect_domain}"
}
