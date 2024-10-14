locals {
  cognito_domain_name = replace(replace(replace(replace("${var.environment}", "aws", ""), "amazon", ""), "cognito", ""), "-", "")
  isProduction        = var.environment == module.environments.PRODUCTION ? 1 : 0
  isNonProduction     = var.environment == module.environments.PRODUCTION ? 0 : 1
}