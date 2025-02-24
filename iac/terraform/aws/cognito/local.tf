locals {
  cognito_domain_prefix = var.environment == module.environments.PRODUCTION ? "signin" : "signin-${replace(replace(replace(replace(var.environment, "aws", ""), "amazon", ""), "cognito", ""), "-", "")}"
  cognito_domain_name   = "${local.cognito_domain_prefix}.${var.bloodconnect_domain}"
}
