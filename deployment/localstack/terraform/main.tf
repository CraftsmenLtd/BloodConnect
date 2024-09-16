module "aws" {
  source              = "../../../iac/terraform/aws"
  environment         = "localstack"
  bloodconnect_domain = "example.com"

  providers = {
    aws.us-east-1 = aws.us-east-1
  }
}
