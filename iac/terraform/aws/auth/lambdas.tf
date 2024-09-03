locals {
  lambda_archive_path = "${path.module}/../../../../core/services/aws/.build/zips"
  lambda_options = {
    refresh-token = {
      name      = "refresh-token"
      handler   = "refreshToken.default"
      zip_path  = "${local.lambda_archive_path}/refreshToken.zip"
      statement = local.policies.common_policies
      env_variables = {
        foo = "bar"
      }
    },
    register-organization = {
      name          = "register-organization"
      handler       = "registerOrganization.default"
      zip_path      = "${local.lambda_archive_path}/registerOrganization.zip"
      statement     = local.policies.common_policies
      env_variables = {}
    }
  }
}
