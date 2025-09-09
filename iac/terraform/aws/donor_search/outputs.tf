output "donation_request_queue_arn" {
  value = module.donation_request_queue.queue_arn
}

output "donation_status_manager_queue_arn" {
  value = module.donation_status_manager_queue.queue_arn
}

output "donor_search_lambda_name" {
  value = module.donor_search_lambda["donor-search"].lambda_function_name
}

output "donor_search_lambda_arn" {
  value = module.donor_search_lambda["donor-search"].lambda_arn
}
