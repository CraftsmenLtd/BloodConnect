locals {
  lambda_archive_path = "${path.module}/../../../../core/services/aws/.build/zips"
  lambda_options = {
    refresh-token = {
      name      = "refresh-token"
      zip_path  = "${local.lambda_archive_path}/refreshToken.zip"
      handler   = "refreshToken.default"
      statement = local.policies.common_policies
      env_variables = {
        foo = "bar"
      }
    },
    register-org = {
      name      = "register-org"
      zip_path  = "${local.lambda_archive_path}/registerOrg.zip"
      handler   = "registerOrg.default"
      statement = local.policies.common_policies
      env_variables = {}
    }
  }
}
