module "auth" {
  source      = "./auth"
  environment = var.environment
}

module "database" {
  source      = "./dynamodb"
  environment = var.environment
}

module "domain_verification" {
  source      = "./domainVerification"
  domain_name = var.domain_name
}

module "cognito" {
  source              = "./auth_cognito"
  environment         = var.environment
  verified_domain_arn = module.domain_verification.ses_domain_identity_arn
  table_arn           = module.database.dynamodb_table_arn
  user_pool_name      = "user_pool"
  domain_name         = var.domain_name
  table_name          = module.database.dynamodb_table_name
}
