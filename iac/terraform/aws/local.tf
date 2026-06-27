# Chat module (REQ-001). Declared here rather than modules.tf so this change stays
# confined to the file TASK-004 is scoped to edit; relocate to modules.tf if preferred.
module "chat" {
  source                      = "./chat"
  environment                 = var.environment
  dynamodb_table_arn          = module.database.dynamodb_table_arn
  push_notification_queue     = module.notification.push_notification_queue
  cognito_user_pool_id        = module.cognito.user_pool_id
  cognito_user_pool_client_id = module.cognito.user_pool_client_id
}

locals {
  is_budget_set = var.budget_settings.set_budget ? 1 : 0

  all_lambda_metadata = concat(
    module.blood_donation.lambda_metadata,
    module.notification.lambda_metadata,
    module.user.lambda_metadata,
    module.logger.lambda_metadata,
    module.maps.lambda_metadata,
    module.chat.lambda_metadata
  )

  all_lambda_invoke_arns = merge({
    for lambda in local.all_lambda_metadata :
    lambda.invocation_arn_placeholder => lambda.lambda_invoke_arn
  })

  bloodconnect_environment_domain = var.environment == module.environments.PRODUCTION ? var.bloodconnect_domain : "${var.environment}.${var.bloodconnect_domain}"
}
