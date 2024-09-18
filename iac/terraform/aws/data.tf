data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

data "aws_ses_domain_identity" "existing_domain" {
  domain = ""
}
