output "donor_search_lambda_name" {
  value = module.donor_search_lambda["donor-search"].lambda_function_name
}

output "donor_search_lambda_arn" {
  value = module.donor_search_lambda["donor-search"].lambda_arn
}
