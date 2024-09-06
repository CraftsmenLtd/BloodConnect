module "aws" {
  source         = "../../../iac/terraform/aws"
  environment    = var.aws_environment
  hosted_zone_id = data.aws_route53_zone.route53_zone.zone_id
}

data "aws_route53_zone" "route53_zone" {
  name         = var.domain_name
}

