locals {
  web_client_domain = var.environment == module.environments.PRODUCTION ? var.bloodconnect_domain : "${var.environment}.${var.bloodconnect_domain}"
}
