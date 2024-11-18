locals {
  lambda_options = {
    create-donation = {
      name                       = "create-donation-request"
      handler                    = "createBloodDonation.default"
      zip_path                   = "createBloodDonation.zip"
      statement                  = concat(local.policies.common_policies, local.policies.dynamodb_create_policy)
      invocation_arn_placeholder = "CREATE_BLOOD_DONATION_INVOCATION_ARN"
      env_variables = {
        DYNAMODB_TABLE_NAME = split("/", var.dynamodb_table_arn)[1]
      }
    },
    update-donation = {
      name     = "update-donation-request"
      handler  = "updateBloodDonation.default"
      zip_path = "updateBloodDonation.zip"
      statement = concat(
        local.policies.common_policies,
        local.policies.dynamodb_create_policy,
        local.policies.dynamodb_update_policy
      )
      invocation_arn_placeholder = "UPDATE_BLOOD_DONATION_INVOCATION_ARN"
      env_variables = {
        DYNAMODB_TABLE_NAME = split("/", var.dynamodb_table_arn)[1]
      }
    },
    donor-request-acceptance = {
      name     = "accept-donation-request"
      handler  = "acceptDonationRequest.default"
      zip_path = "acceptDonationRequest.zip"
      statement = concat(
        local.policies.common_policies,
        local.policies.dynamodb_create_policy,
        local.policies.dynamodb_update_policy
      )
      invocation_arn_placeholder = "ACCEPT_DONATION_REQUEST_INVOCATION_ARN"
      env_variables = {
        DYNAMODB_TABLE_NAME = split("/", var.dynamodb_table_arn)[1]
      }
    }
  }
}
