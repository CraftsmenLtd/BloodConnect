data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

locals {
  donor_search_lambda_name = "${var.environment}-donor-search"
  donor_search_lambda_arn  = "arn:aws:lambda:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:function:${local.donor_search_lambda_name}"
}
