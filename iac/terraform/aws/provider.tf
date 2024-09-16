terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
      configuration_aliases = [
        aws.us-east-1
      ]
    }
  }
}

provider "aws" {
  region = "us-east-1"
  alias = "us-east-1"
}