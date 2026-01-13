module "environments" {
  source = "./environments"
}

module "user" {
  source             = "./user"
  environment        = var.environment
  dynamodb_table_arn = module.database.dynamodb_table_arn
}

module "blood_donation" {
  source                  = "./donation"
  environment             = var.environment
  dynamodb_table_arn      = module.database.dynamodb_table_arn
  push_notification_queue = module.notification.push_notification_queue
}

module "web_client" {
  source      = "./web-client"
  environment = var.environment
}

module "monitoring_site" {
  source                     = "./monitoring-site"
  environment                = var.environment
  site_path                  = "monitoring"
  dynamodb_table_name        = module.database.dynamodb_table_name
  cognito_user_pool_id       = module.cognito.user_pool_id
  cognito_app_client_id      = module.cognito.monitoring_user_pool_app_client_id
  maintainers_role           = module.cognito.maintainers_role
  cognito_identity_pool_id   = module.cognito.identity_pool_id
  bloodconnect_domain        = local.bloodconnect_environment_domain
  cognito_custom_domain_name = module.cognito.aws_cognito_custom_domain_name
}

locals {
  monitoring_site_path = "monitoring"
}

module "cloudfront" {
  source                          = "./cloudfront"
  environment                     = var.environment
  acm_certificate_arn             = data.aws_acm_certificate.certificate.arn
  rest_api_id                     = aws_api_gateway_rest_api.rest_api.id
  static_site_bucket              = module.web_client.static_site_bucket
  monitoring_site_bucket          = module.monitoring_site.site_bucket
  failover_bucket                 = module.web_client.failover_bucket
  log_store_bucket                = module.web_client.log_store_bucket
  bloodconnect_environment_domain = local.bloodconnect_environment_domain
  monitoring_site_path            = local.monitoring_site_path
}

module "database" {
  source      = "./dynamodb"
  environment = var.environment
}

module "cognito" {
  source                 = "./cognito"
  environment            = var.environment
  verified_domain_arn    = data.aws_ses_domain_identity.existing_domain.arn
  dynamodb_table_arn     = module.database.dynamodb_table_arn
  bloodconnect_domain    = var.bloodconnect_domain
  google_client_id       = var.google_client_id
  google_client_secret   = var.google_client_secret
  facebook_client_id     = var.facebook_client_id
  facebook_client_secret = var.facebook_client_secret
  acm_certificate_arn    = data.aws_acm_certificate.certificate.arn
  hosted_zone_id         = data.aws_route53_zone.main.zone_id
  monitoring_site_path   = local.monitoring_site_path

}

module "donor_search" {
  source                    = "./donor_search"
  environment               = var.environment
  dynamodb_table_arn        = module.database.dynamodb_table_arn
  push_notification_queue   = module.notification.push_notification_queue
  api_gateway_id            = aws_api_gateway_rest_api.rest_api.id
  api_gateway_execution_arn = aws_api_gateway_rest_api.rest_api.execution_arn
}

module "eventbridge" {
  source                            = "./eventbridge"
  environment                       = var.environment
  dynamodb_table_stream_arn         = module.database.dynamodb_table_stream_arn
  donation_status_manager_queue_arn = module.donor_search.donation_status_manager_queue_arn
  dynamodb_table_arn                = module.database.dynamodb_table_arn
}

module "notification" {
  source                  = "./notification"
  environment             = var.environment
  dynamodb_table_arn      = module.database.dynamodb_table_arn
  firebase_token_s3_url   = var.firebase_token_s3_url
}

module "maps" {
  source              = "./maps"
  environment         = var.environment
  google_maps_api_key = var.google_maps_api_key
}

module "logger" {
  source      = "./logger"
  environment = var.environment
}

module "dashboard" {
  count                    = var.environment == module.environments.PRODUCTION ? 1 : 0
  source                   = "./dashboard"
  environment              = var.environment
  donor_search_lambda_name = module.donor_search.donor_search_lambda_name
  create_user_lambda_name  = module.user.create_user_lambda_name
}
