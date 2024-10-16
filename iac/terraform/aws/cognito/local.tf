locals {
  cognito_domain_name = replace(replace(replace(replace("${var.environment}", "aws", ""), "amazon", ""), "cognito", ""), "-", "")
  productionEnvironment        = var.environment == module.environments.PRODUCTION ? 1 : 0
  NonProductionEnvironment     = var.environment == module.environments.PRODUCTION ? 0 : 1
}