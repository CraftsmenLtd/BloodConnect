module "aws" {
  source              = "../../../iac/terraform/aws"
  environment         = "localstack"
}
