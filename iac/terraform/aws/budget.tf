resource "aws_budgets_budget" "blood_connect_budget" {
  count = local.is_budget_set

  name              = "budget-monthly"
  budget_type       = "COST"
  limit_amount      = var.budget_settings.amount
  limit_unit        = "USD"
  time_period_end   = "2099-12-31_00:00"
  time_period_start = "2023-01-01_00:00"
  time_unit         = "MONTHLY"

  cost_filter {
    name = "TagKeyValue"
    values = [
      "BloodConnect${"$"}${var.billing_tag}"
    ]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = var.budget_settings.threshold
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = var.budget_settings.emails
  }
}
