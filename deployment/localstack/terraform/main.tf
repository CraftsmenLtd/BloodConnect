module "aws" {
  source              = "../../../iac/terraform/aws"
  environment         = "localstack"
  bloodconnect_domain = "example.com"

  providers = {
    aws.us-east-1 = aws.us-east-1
  }
  depends_on = [ aws_acm_certificate.name, aws_route53_zone.main ]
}
