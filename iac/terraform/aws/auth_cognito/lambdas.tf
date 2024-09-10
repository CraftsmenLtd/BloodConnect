locals {
  lambda_archive_path = "${path.module}/../../../../core/services/aws/.build/zips"
  lambda_options = {
    custom_email_template = {
      name          = "custom-email-template"
      handler       = "customEmailTemplate.default"
      zip_path      = "${local.lambda_archive_path}/customEmailTemplate.zip"
      statement     = local.policies.common_policies
      env_variables = {}
    },
    post_confirmation = {
      name      = "post-confirmation"
      handler   = "postConfirmation.default"
      zip_path  = "${local.lambda_archive_path}/postConfirmation.zip"
      statement = concat(local.policies.common_policies, local.policies.dynamodb_policy)
      env_variables = {
        DYNAMODB_TABLE = "${var.table_name}"
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
