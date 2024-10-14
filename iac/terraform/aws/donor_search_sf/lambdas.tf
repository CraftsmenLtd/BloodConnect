locals {
  lambda_options = {
    donor-notification-lambda = {
      name                       = "donor-notification-lambda"
      handler                    = "donorNotificationLambda.default"
      zip_path                   = "${var.lambda_archive_path}/donorNotificationLambda.zip"
      statement                  = concat(local.policies.common_policies, local.policies.dynamodb_policy, local.policies.sqs_policy)
      env_variables = {
        DONOR_SEARCH_RETRY_QUEUE_URL = var.donor_search_retry_queue_url
      }
    }
  }
}
