locals {
  lambda_archive_path = "${path.module}/../../../../core/services/aws/.build/zips"
  lambda_options = {
    health-check = {
      name                       = "health-check"
      handler                    = "healthCheck.default"
      zip_path                   = "${local.lambda_archive_path}/healthCheck.zip"
      statement                  = local.policies.common_policies
      invocation_arn_placeholder = "HEALTH_CHECK_INVOCATION_ARN"
      env_variables = {
        foo = "bar"
      }
    }
    register-organization = {
      name                       = "register-organization"
      handler                    = "registerOrganization.default"
      zip_path                   = "${local.lambda_archive_path}/registerOrganization.zip"
      statement                  = local.policies.common_policies
      invocation_arn_placeholder = "REGISTER_ORGANIZATION_INVOCATION_ARN"
      env_variables              = {}
    }
  }
}
