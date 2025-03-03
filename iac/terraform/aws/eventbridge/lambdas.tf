locals {
  lambda_options = {
    monitor-donation-request = {
      name      = "monitor-donation-request"
      handler   = "monitorDonationRequestLambda.default"
      zip_path  = "monitorDonationRequest.zip"
      statement = concat(local.policies.common_policies, local.policies.s3_policy)

      env_variables = {
        MAX_GEOHASH_LENGTH           = var.max_geohash_length
        MONITOR_DONATION_BUCKET_NAME = aws_s3_bucket.monitor_donation_request.id
        MAX_GEOHASH_STORAGE          = var.max_geohash_storage
      }
    }
  }
}

module "lambda" {
  source        = "./../lambda"
  environment   = var.environment
  lambda_option = local.lambda_options.monitor-donation-request
}
