terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

module "aws" {
  source      = "./aws/"
  environment = var.aws_environment
}

resource "aws_s3_bucket" "name" {
  bucket = "shuaib"
}
