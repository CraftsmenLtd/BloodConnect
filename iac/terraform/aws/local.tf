locals {
  is_budget_set = var.budget_settings.set_budget ? 1 : 0

  all_lambda_metadata = concat(
    module.blood_donation.lambda_metadata,
    module.notification.lambda_metadata,
    module.user.lambda_metadata
  )

  all_lambda_invoke_arns = merge({
    for lambda in local.all_lambda_metadata :
    lambda.invocation_arn_placeholder => lambda.lambda_invoke_arn
  })

  bloodconnect_environment_domain = var.environment == module.environments.PRODUCTION ? var.bloodconnect_domain : "${var.environment}.${var.bloodconnect_domain}"
}
