data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

locals {
  donor_search_lambda_name = "${var.environment}-donor-search"
  donor_search_lambda_arn  = "arn:aws:lambda:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:function:${local.donor_search_lambda_name}"

  donation_request_initiator_lambda_name = "${var.environment}-donation-request-initiator"
  donation_request_initiator_lambda_arn  = "arn:aws:lambda:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:function:${local.donation_request_initiator_lambda_name}"

  donation_status_manager_lambda_name = "${var.environment}-donation-status-manager"
  donation_status_manager_lambda_arn  = "arn:aws:lambda:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:function:${local.donation_status_manager_lambda_name}"

  create_chat_channel_lambda_name = "${var.environment}-create-chat-channel"
  create_chat_channel_lambda_arn  = "arn:aws:lambda:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:function:${local.create_chat_channel_lambda_name}"

  lock_chat_channel_lambda_name = "${var.environment}-lock-chat-channel"
  lock_chat_channel_lambda_arn  = "arn:aws:lambda:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:function:${local.lock_chat_channel_lambda_name}"
}
