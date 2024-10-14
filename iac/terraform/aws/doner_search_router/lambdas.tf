locals {
  lambda_options = {
    doner-request-router = {
      name                       = "doner-request-router"
      handler                    = "donerRequestRouter.default"
      zip_path                   = "${var.lambda_archive_path}/donerRequestRouter.zip"
      statement                  = concat(local.policies.common_policies, local.policies.dynamodb_policy, local.policies.sfn_policy)
      env_variables = {
        DYNAMODB_TABLE_NAME = split("/", aws_dynamodb_table.donor_requests_table.arn)[1]
        STEP_FUNCTION_ARN   = aws_sfn_state_machine.donor_search_state_machine.arn
      }
    },
    donor-notification-lambda = {
      name                       = "donor-notification-lambda"
      handler                    = "donorNotificationLambda.default"
      zip_path                   = "${var.lambda_archive_path}/donorNotificationLambda.zip"
      statement                  = concat(local.policies.common_policies, local.policies.dynamodb_policy, local.policies.sqs_policy)
      env_variables = {
        DONOR_SEARCH_RETRY_QUEUE_URL = aws_sqs_queue.donor_search_queue.url
      }
    }
  }
}
