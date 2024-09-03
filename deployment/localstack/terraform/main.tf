module "aws" {
  source         = "../../../iac/terraform/aws"
  environment    = "localstack"
  hosted_zone_id = aws_route53_zone.my_zone.zone_id
}

resource "aws_route53_zone" "my_zone" {
  name = "bloodconnect.net"
}
