locals {
  donor_search_lambda_options = {
    donation-request-initiator = {
      name         = "donation-request-initiator"
      handler      = "donationRequestInitiator.default"
      js_file_name = "donationRequestInitiator.js"
      statement = concat(
        local.policies.common_policies,
        local.policies.dynamodb_policy,
        local.policies.sqs_policy
      )
      env_variables = {
        DYNAMODB_TABLE_NAME                   = split("/", var.dynamodb_table_arn)[1]
        DONOR_SEARCH_QUEUE_URL                = module.donor_search_queue.queue_url
        NEIGHBOR_SEARCH_GEOHASH_PREFIX_LENGTH = local.neighbor_search_geohash_prefix_length
      }
    },
    donor-search = {
      name         = "donor-search"
      handler      = "donorSearch.default"
      js_file_name = "donorSearch.js"
      statement = concat(
        local.policies.common_policies,
        local.policies.dynamodb_policy,
        local.policies.sqs_policy
      )
      memory_size = 1024
      timeout     = local.donor_search_queue_visibility_timeout_seconds - 60
      env_variables = {
        DYNAMODB_TABLE_NAME                     = split("/", var.dynamodb_table_arn)[1]
        DONOR_SEARCH_MAX_INITIATING_RETRY_COUNT = local.donor_search_max_initiating_retry_count
        DONOR_SEARCH_QUEUE_URL                  = module.donor_search_queue.queue_url
        NOTIFICATION_QUEUE_URL                  = var.push_notification_queue.url
        MAX_GEOHASH_CACHE_ENTRIES_COUNT         = local.max_geohash_cache_entries_count
        MAX_GEOHASH_CACHE_MB_SIZE               = local.max_geohash_cache_mb_size
        MAX_GEOHASH_CACHE_TIMEOUT_MINUTES       = local.max_geohash_cache_timeout_minutes
        MAX_GEOHASH_NEIGHBOR_SEARCH_LEVEL       = local.max_geohash_neighbor_search_level
        CACHE_GEOHASH_PREFIX_LENGTH             = local.cache_geohash_prefix_length
        NEIGHBOR_SEARCH_GEOHASH_PREFIX_LENGTH   = local.neighbor_search_geohash_prefix_length
        MAX_GEOHASHES_PER_EXECUTION             = local.max_geohashes_per_execution
        DONOR_SEARCH_QUEUE_MIN_DELAY_SECONDS    = local.donor_search_queue_min_delay_seconds
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
