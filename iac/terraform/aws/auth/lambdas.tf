locals {
  lambda_options = {
    register-organization = {
      name                       = "register-organization"
      handler                    = "registerOrganization.default"
      zip_path                   = "registerOrganization.zip"
      statement                  = local.policies.common_policies
      invocation_arn_placeholder = "REGISTER_ORGANIZATION_INVOCATION_ARN"
      env_variables              = {}
    }
  }
}
