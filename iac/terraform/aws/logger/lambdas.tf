locals {
  lambda_options = {
    add-ui-logs = {
      name                       = "add-ui-logs"
      handler                    = "addUiLogs.default"
      zip_path                   = "addUiLogs.zip"
      statement                  = local.policies.common_policies
      invocation_arn_placeholder = "ADD_UI_LOGS_INVOCATION_ARN"
      env_variables = {
      }
    }
  }
}
