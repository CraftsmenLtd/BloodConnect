provider "aws" {
  default_tags {
    tags = {
      BloodConnect = var.billing_tag
    }
  }
}
