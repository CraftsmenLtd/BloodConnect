locals {
  donor_router_lambda_options = {
    donor-request-router = {
      name     = "donor-request-router"
      handler  = "donorRequestRouter.default"
      zip_path = "donorRequestRouter.zip"
      statement = concat(local.policies.common_policies,
        local.policies.dynamodb_policy,
        [
          {
            sid = "StepFunctionPolicy"
            actions = [
              "states:StartExecution"
            ]
            resources = [aws_sfn_state_machine.donor_search_state_machine.arn]
          }
        ],
      local.policies.sqs_policy)
      env_variables = {
        DYNAMODB_TABLE_NAME = split("/", var.dynamodb_table_arn)[1]
        STEP_FUNCTION_ARN   = aws_sfn_state_machine.donor_search_state_machine.arn
        MAX_RETRY_COUNT     = var.donor_search_max_retry_count
      }
    }
  }

  step_function_lambda_options = {
    calculate-donors-to-notify = {
      name      = "calculate-donors-to-notify"
      handler   = "calculateDonorsToNotify.default"
      zip_path  = "calculateDonorsToNotify.zip"
      statement = concat(local.policies.common_policies)
      env_variables = {
      }
    }
    donor-search-evaluator = {
      name      = "donor-search-evaluator"
      handler   = "donorSearchEvaluator.default"
      zip_path  = "donorSearchEvaluator.zip"
      statement = concat(local.policies.common_policies)
      env_variables = {
      }
    }
  }
}
