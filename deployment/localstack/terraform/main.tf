module "aws" {
  source              = "../../../iac/terraform/aws"
  environment         = "localstack"
  bloodconnect_domain = "bloodconnect.net"
}
