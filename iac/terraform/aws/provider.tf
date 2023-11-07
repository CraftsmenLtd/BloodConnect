terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

provider "aws" {
  default_tags {
    tags = {
      BloodConnect = var.billing_tag
    }
  }
}