locals {
  lambda_options = {
    monitor-donation-request = {
      name         = "monitor-donation-request"
      handler      = "monitorDonationRequest.default"
      js_file_name = "monitorDonationRequest.js"
      statement    = concat(local.policies.common_policies, local.policies.s3_policy)

      env_variables = {
        MAX_GEOHASH_LENGTH             = var.max_geohash_length
        MONITOR_DONATION_BUCKET_NAME   = aws_s3_bucket.monitoring_site.id
        MAX_GEOHASH_STORAGE            = var.max_geohash_storage
        MAX_GEOHASH_PREFIX_LENGTH      = var.max_geohash_prefix_length
        MONITOR_DONATION_BUCKET_PREFIX = local.monitor_donation_request_s3_path_prefix
      }
    }
  }
}

locals {
  monitor_donation_request_s3_path_prefix = "data"
}

module "lambda" {
  source        = "./../lambda"
  environment   = var.environment
  lambda_option = local.lambda_options.monitor-donation-request
}
