locals {
  is_production = var.environment == module.environments.PRODUCTION

  # v2 donor search wave tunables
  max_cells_per_execution                  = 500
  search_interval_seconds                  = 180
  initial_wave_delay_seconds               = 0
  retry_delay_seconds                      = 300
  max_retries                              = 3
  acceptance_window_seconds                = 3600
  dormant_threshold_seconds                = 3600
  parallel_query_concurrency               = 25
  donor_search_max_initiating_retry_count  = 5

  # Public post feed
  feed_max_radius_km     = 50
  feed_default_radius_km = 10

  donor_search_lambda_name = "${var.environment}-donor-search"
  donor_search_lambda_arn  = "arn:aws:lambda:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:function:${local.donor_search_lambda_name}"

  eventbridge_scheduler_role_name = "${var.environment}-eventbridge-scheduler-role"
  eventbridge_scheduler_role_arn  = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/${local.eventbridge_scheduler_role_name}"
}
