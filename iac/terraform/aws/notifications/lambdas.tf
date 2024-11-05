locals {
  lambda_options = {
    register_user_sns_endpoint = {
      name          = "register-user-sns-endpoint"
      handler       = "registerUserSnsEndpoint.default"
      zip_path      = "registerUserSnsEndpoint.zip"
      statement     = concat(local.policies.common_policies, local.policies.dynamodb_policy)
      env_variables = {
        DYNAMODB_TABLE_NAME = split("/", var.dynamodb_table_arn)[1],
      }
    }
  }
}
