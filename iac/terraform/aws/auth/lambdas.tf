locals {
  lambda_options = {
    refresh-token = {
      name                       = "refresh-token"
      handler                    = "refreshToken.default"
      zip_path                   = "${var.lambda_archive_path}/refreshToken.zip"
      statement                  = local.policies.common_policies
      invocation_arn_placeholder = "REFRESH_TOKEN_INVOCATION_ARN"
      env_variables = {
        foo = "bar"
      }
    }
    register-organization = {
      name                       = "register-organization"
      handler                    = "registerOrganization.default"
      zip_path                   = "${var.lambda_archive_path}/registerOrganization.zip"
      statement                  = local.policies.common_policies
      invocation_arn_placeholder = "REGISTER_ORGANIZATION_INVOCATION_ARN"
      env_variables              = {}
    }
  }
}
