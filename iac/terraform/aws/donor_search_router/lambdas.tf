locals {
  lambda_options = {
    donor-request-router = {
      name      = "donor-request-router"
      handler   = "donorRequestRouter.default"
      zip_path  = "donorRequestRouter.zip"
      statement = concat(local.policies.common_policies, local.policies.dynamodb_policy, local.policies.sfn_policy, local.policies.sqs_policy)
      env_variables = {
        DYNAMODB_TABLE_NAME = split("/", var.dynamodb_table_arn)[1]
        STEP_FUNCTION_ARN   = var.donor_search_sf_arn
        MAX_RETRY_COUNT     = var.donor_search_max_retry_count
      }
    }
  }
}
