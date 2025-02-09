module "donation_request_queue" {
  source                     = "./../sqs"
  environment                = var.environment
  queue_name                 = "donation-request-queue"
  enable_lambda_event_source = true
  lambda_function_arn        = module.donor_router_lambda["donation-request-initiator"].lambda_arn
}

module "donor_search_queue" {
  source                     = "./../sqs"
  environment                = var.environment
  queue_name                 = "donor-search-queue"
  enable_lambda_event_source = true
  lambda_function_arn        = module.donor_router_lambda["donor-search"].lambda_arn
  batch_size                 = 1
}

module "donation_status_manager_queue" {
  source                     = "./../sqs"
  environment                = var.environment
  queue_name                 = "donation-status-manager"
  enable_lambda_event_source = true
  lambda_function_arn        = module.donor_router_lambda["donation-status-manager"].lambda_arn
}
