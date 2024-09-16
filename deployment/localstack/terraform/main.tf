module "aws" {
  source              = "../../../iac/terraform/aws"
  environment         = "localstack"
  bloodconnect_domain = "example.com"

  providers = {
    aws.us-east-1 = aws.us-east-1
  }
  depends_on = [ aws_acm_certificate.name, aws_route53_zone.main ]
}

resource "aws_acm_certificate" "name" {
  domain_name       = "example.com"
  validation_method = "DNS"

  tags = {
    Environment = "test"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_zone" "main" {
  name = "example.com"
}