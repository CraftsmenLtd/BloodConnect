module "lambdas" {
  source         = "./../lambdas"
  environment    = var.environment
  lambda_options = local.lambda_options
}
