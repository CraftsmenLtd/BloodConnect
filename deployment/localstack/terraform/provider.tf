terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "5.70.0"
    }
  }
}

provider "aws" {
  alias  = "us-east-1"
  region = "us-east-1"

  access_key = "fake"
  secret_key = "fake"

  endpoints {
    acm = "http://localhost:4566"
    sts = "http://localhost:4566"
    iam = "http://localhost:4566"
  }
}
