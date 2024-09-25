locals {
  is_budget_set    = var.budget_settings.set_budget ? 1 : 0
  PROD_ENVIRONMENT = "prod"
  all_lambda_metadata = concat(
    module.auth.lambda_metadata
  )
  all_lambda_invoke_arns = merge({
    for lambda in local.all_lambda_metadata :
    lambda.invocation_arn_placeholder => lambda.lambda_invoke_arn
  })
  apigateway-domain = var.environment == local.PROD_ENVIRONMENT ? "api.${var.bloodconnect_domain}" : "${var.environment}-api.${var.bloodconnect_domain}"
}
