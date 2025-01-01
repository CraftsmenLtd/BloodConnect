module "lambda" {
  for_each      = local.lambda_options
  source        = "./../lambda"
  environment   = var.environment
  lambda_option = each.value
}
