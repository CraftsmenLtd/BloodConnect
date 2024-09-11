locals {
  lambda_archive_path = "${path.module}/../../../../core/services/aws/.build/zips"
  lambda_options = {
    cognito_custom_message_trigger = {
      name          = "custom-message-trigger"
      handler       = "customMessageTrigger.handler"
      zip_path      = "${local.lambda_archive_path}/customMessageTrigger.zip"
      statement     = local.policies.common_policies
      env_variables = {}
    },
    cognito_post_confirmation_trigger = {
      name      = "post-confirmation-trigger"
      handler   = "postConfirmationTrigger.handler"
      zip_path  = "${local.lambda_archive_path}/postConfirmationTrigger.zip"
      statement = concat(local.policies.common_policies, local.policies.dynamodb_policy)
      env_variables = {
        DYNAMODB_TABLE_NAME = split("/", var.dynamodb_table_arn)[1]
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
