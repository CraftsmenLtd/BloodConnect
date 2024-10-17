terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "5.70.0"
    }
  }
  backend "s3" {}
}

provider "aws" {
  alias  = "us-east-1"
  region = "us-east-1"
}