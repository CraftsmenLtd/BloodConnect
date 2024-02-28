module "terraform" {
  source          = "../../../iac/terraform"
  aws_environment = var.aws_environment
}
