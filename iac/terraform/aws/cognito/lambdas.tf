locals {
  lambda_options = {
    cognito_custom_message_trigger = {
      name          = "custom-message-trigger"
      handler       = "customMessageTrigger.default"
      js_file_name  = "customMessageTrigger.js"
      statement     = local.policies.common_policies
      env_variables = {}
    },
    cognito_post_confirmation_trigger = {
      name         = "post-confirmation-trigger"
      handler      = "postConfirmationTrigger.default"
      js_file_name = "postConfirmationTrigger.js"
      statement    = concat(local.policies.common_policies, local.policies.dynamodb_policy, local.policies.cognito_policy, local.policies.ses_policy)
      env_variables = {
        DYNAMODB_TABLE_NAME = split("/", var.dynamodb_table_arn)[1],
        EMAIL_SENDER        = "no-reply@${var.bloodconnect_domain}"
      }
    }
  }
}

module "lambda" {
  for_each      = local.lambda_options
  source        = "./../lambda"
  environment   = var.environment
  lambda_option = each.value
}

resource "aws_lambda_permission" "lambda_invoke_permission" {
  for_each = local.lambda_options

  statement_id  = "AllowExecutionFromCognito-${each.key}"
  action        = "lambda:InvokeFunction"
  function_name = module.lambda[each.key].lambda_arn
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = aws_cognito_user_pool.user_pool.arn
}
