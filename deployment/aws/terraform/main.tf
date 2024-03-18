module "aws" {
  source              = "../../../iac/terraform/aws"
  environment         = var.aws_environment
  bloodconnect_domain = var.bloodconnect_domain
}
