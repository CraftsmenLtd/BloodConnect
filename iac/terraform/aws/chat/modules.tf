module "lambda" {
  for_each              = local.lambda_options
  source                = "./../lambda"
  environment           = var.environment
  lambda_option         = each.value
  log_retention_in_days = var.log_retention_in_days
}
