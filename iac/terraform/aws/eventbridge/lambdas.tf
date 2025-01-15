locals {
  lambda_options = {
    monitor-donation-request = {
      name      = "monitor-donation-request-lambda"
      handler   = "monitorDonationRequest.default"
      zip_path  = "monitorDonationRequest.zip"
      statement = local.policies.common_policies

      env_variables = {
        AWS_REGION          = data.aws_region.current.name
        MAX_GEOHASH_LENGTH  = var.max_geohash_length
        BUCKET_NAME         = aws_s3_bucket.monitor_donation_request.id
        MAX_GEOHASH_STORAGE = var.max_geohash_storage
      }
    }
  }
}

module "lambda" {
  source        = "./../lambda"
  environment   = var.environment
  lambda_option = local.lambda_options.monitor-donation-request
}
