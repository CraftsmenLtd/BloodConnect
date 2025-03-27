locals {
  lambda_options = {
    add-ui-logs = {
      name                       = "add-ui-logs"
      handler                    = "addUiLogs.default"
      js_file_name               = "addUiLogs.js"
      statement                  = local.policies.common_policies
      invocation_arn_placeholder = "ADD_UI_LOGS_INVOCATION_ARN"
      env_variables = {
      }
    }
  }
}
