module "donor_router_lambda" {
  for_each      = local.donor_search_lambda_options
  source        = "./../lambda"
  environment   = var.environment
  lambda_option = each.value
}
