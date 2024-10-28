locals {
  lambda_options = {
    calculate-donors-to-notify = {
      name      = "calculate-donors-to-notify"
      handler   = "calculateDonorsToNotify.default"
      zip_path  = "calculateDonorsToNotify.zip"
      statement = concat(local.policies.common_policies)
      env_variables = {
      }
    }
  }
}
