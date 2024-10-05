module "aws" {
  source               = "../../../iac/terraform/aws"
  environment          = var.aws_environment
  bloodconnect_domain  = var.bloodconnect_domain
  google_client_id     = var.google_client_id
  google_client_secret = var.google_client_secret

  providers = {
    aws.us-east-1 = aws.us-east-1
  }
}
