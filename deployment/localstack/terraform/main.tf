module "terraform" {
  source          = "../../../iac/terraform"
  aws_environment = "localstack"
}
