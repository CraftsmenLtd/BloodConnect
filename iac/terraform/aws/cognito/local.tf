locals {
  cognito_domain_name      = "bloodconnect-${replace(replace(replace(replace(var.environment, "aws", ""), "amazon", ""), "cognito", ""), "-", "")}"
}