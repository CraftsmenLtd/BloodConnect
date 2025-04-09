locals {
  cognito_old_domain_name  = "bloodconnect-${replace(replace(replace(replace(var.environment, "aws", ""), "amazon", ""), "cognito", ""), "-", "")}"
  cognito_domain_prefix    = var.environment == module.environments.PRODUCTION ? "signin" : "signin-${replace(replace(replace(replace(var.environment, "aws", ""), "amazon", ""), "cognito", ""), "-", "")}"
  cognito_domain_name      = "${local.cognito_domain_prefix}.${var.bloodconnect_domain}"
  environment_aware_domain = var.environment == module.environments.PRODUCTION ? var.bloodconnect_domain : "${var.environment}.${var.bloodconnect_domain}"
}
