data "aws_acm_certificate" "certificate" {
  domain      = var.bloodconnect_domain
  statuses    = ["ISSUED"]
  most_recent = true
  provider    = aws.virginia
}

provider "aws" {
  alias  = "virginia"
  region = "us-east-1"
}
