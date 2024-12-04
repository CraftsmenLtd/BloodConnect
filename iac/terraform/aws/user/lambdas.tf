locals {
  lambda_options = {
    update-user = {
      name                       = "update-user"
      handler                    = "updateUser.default"
      zip_path                   = "updateUser.zip"
      statement                  = concat(local.policies.common_policies, local.policies.dynamodb_policy)
      invocation_arn_placeholder = "UPDATE_USER_INVOCATION_ARN"
      env_variables = {
        DYNAMODB_TABLE_NAME          = split("/", var.dynamodb_table_arn)[1]
        MIN_MONTHS_BETWEEN_DONATIONS = var.min_months_between_donations
      }
    }
  }
}
