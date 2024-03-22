module "aws" {
  source              = "../../../iac/terraform/aws"
  environment         = var.aws_environment
}
