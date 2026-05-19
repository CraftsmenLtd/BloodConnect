locals {
  donor_search_lambda_options = {
    donation-request-initiator = {
      name         = "donation-request-initiator"
      handler      = "donationRequestInitiator.default"
      js_file_name = "donationRequestInitiator.js"
      statement = concat(
        local.policies.common_policies,
        local.policies.dynamodb_policy,
        local.policies.sqs_policy,
        local.policies.scheduler_policy
      )
      env_variables = {
        DYNAMODB_TABLE_NAME                     = split("/", var.dynamodb_table_arn)[1]
        DONOR_SEARCH_LAMBDA_ARN                 = local.donor_search_lambda_arn
        SCHEDULER_ROLE_ARN                      = local.eventbridge_scheduler_role_arn
        INITIAL_WAVE_DELAY_SECONDS              = local.initial_wave_delay_seconds
        DONOR_SEARCH_MAX_INITIATING_RETRY_COUNT = local.donor_search_max_initiating_retry_count
      }
    },
    donor-search = {
      name         = "donor-search"
      handler      = "donorSearch.default"
      js_file_name = "donorSearch.js"
      statement = concat(
        local.policies.common_policies,
        local.policies.dynamodb_policy,
        local.policies.sqs_policy,
        local.policies.scheduler_policy
      )
      memory_size = 1024
      timeout     = 300
      env_variables = {
        DYNAMODB_TABLE_NAME                     = split("/", var.dynamodb_table_arn)[1]
        DONOR_SEARCH_MAX_INITIATING_RETRY_COUNT = local.donor_search_max_initiating_retry_count
        NOTIFICATION_QUEUE_URL                  = var.push_notification_queue.url
        MAX_CELLS_PER_EXECUTION                 = local.max_cells_per_execution
        SEARCH_INTERVAL_SECONDS                 = local.search_interval_seconds
        RETRY_DELAY_SECONDS                     = local.retry_delay_seconds
        MAX_RETRIES                             = local.max_retries
        ACCEPTANCE_WINDOW_SECONDS               = local.acceptance_window_seconds
        DORMANT_THRESHOLD_SECONDS               = local.dormant_threshold_seconds
        PARALLEL_QUERY_CONCURRENCY              = local.parallel_query_concurrency
        DONOR_SEARCH_LAMBDA_ARN                 = local.donor_search_lambda_arn
        SCHEDULER_ROLE_ARN                      = local.eventbridge_scheduler_role_arn
      }
    },
    donation-status-manager = {
      name         = "donation-status-manager"
      handler      = "donationStatusManager.default"
      js_file_name = "donationStatusManager.js"
      statement = concat(
        local.policies.common_policies,
        local.policies.dynamodb_policy,
        local.policies.sqs_policy
      )
      env_variables = {
        DYNAMODB_TABLE_NAME = split("/", var.dynamodb_table_arn)[1]
      }
    }
  }
}

resource "aws_lambda_function_recursion_config" "donor_search_recursion_config" {
  function_name  = module.donor_search_lambda["donor-search"].lambda_function_name
  recursive_loop = "Allow"
}
