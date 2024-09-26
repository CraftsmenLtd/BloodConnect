module "auth" {
  source      = "./auth"
  environment = var.environment
}

module "database" {
  source      = "./dynamodb"
  environment = var.environment
}

module "cognito" {
  source              = "./cognito"
  environment         = var.environment
  verified_domain_arn = data.aws_ses_domain_identity.existing_domain.arn
  dynamodb_table_arn  = module.database.dynamodb_table_arn
  bloodconnect_domain = var.bloodconnect_domain
}
