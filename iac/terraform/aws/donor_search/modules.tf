module "donor_router_lambda" {
  for_each      = local.donor_router_lambda_options
  source        = "./../lambda"
  environment   = var.environment
  lambda_option = each.value
}

module "step_function_lambda" {
  for_each      = local.step_function_lambda_options
  source        = "./../lambda"
  environment   = var.environment
  lambda_option = each.value
}
