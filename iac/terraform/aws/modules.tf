module "auth" {
  source             = "./auth"
  environment        = var.environment
  user_pool_id       = module.cognito.user_pool_id
  client_id          = module.cognito.client_id
  user_pool_arn      = module.cognito.user_pool_arn
  dynamodb_table_arn = module.database.dynamodb_table_arn
}

module "database" {
  source      = "./dynamodb"
  environment = var.environment
}

# module "domain_verification" {
#   source      = "./domain_verification"
#   domain_name = var.domain_name
# }

module "cognito" {
  source      = "./cognito"
  environment = var.environment
  # verified_domain_arn = module.domain_verification.ses_domain_identity_arn
  dynamodb_table_arn = module.database.dynamodb_table_arn
  domain_name        = var.domain_name
}
