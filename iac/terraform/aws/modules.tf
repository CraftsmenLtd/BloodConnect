module "environments" {
  source = "./environments"
}

module "auth" {
  source              = "./auth"
  environment         = var.environment
  lambda_archive_path = local.lambda_archive_path
}

<<<<<<< Updated upstream
module "web-client" {
=======
module "blood_donation" {
  source              = "./donation"
  environment         = var.environment
  lambda_archive_path = local.lambda_archive_path
  dynamodb_table_arn  = module.database.dynamodb_table_arn
}

module "web_client" {
>>>>>>> Stashed changes
  source      = "./web-client"
  environment = var.environment
}

module "cloudfront" {
  source                          = "./cloudfront"
  environment                     = var.environment
  acm_certificate_arn             = data.aws_acm_certificate.certificate.arn
  rest_api_id                     = aws_api_gateway_rest_api.rest_api.id
<<<<<<< Updated upstream
  static_site_bucket              = module.web-client.static_site_bucket
  failover_bucket                 = module.web-client.failover_bucket
  log_store_bucket                = module.web-client.log_store_bucket
=======
  static_site_bucket              = module.web_client.static_site_bucket
  failover_bucket                 = module.web_client.failover_bucket
  log_store_bucket                = module.web_client.log_store_bucket
>>>>>>> Stashed changes
  bloodconnect_environment_domain = local.bloodconnect_environment_domain
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
  lambda_archive_path = local.lambda_archive_path
}
