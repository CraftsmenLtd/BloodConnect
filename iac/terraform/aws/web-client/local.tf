locals {
  web_client_domain = var.environment == module.environments.PROD ? var.bloodconnect_domain : "${var.environment}.${var.bloodconnect_domain}"
}
