module "aws" {
  source         = "../../../iac/terraform/aws"
  environment    = "localstack"
  hosted_zone_id = aws_route53_zone.my_zone.zone_id
}

#checkov:skip=CKV2_AWS_38: "Ensure Domain Name System Security Extensions (DNSSEC) signing is enabled for Amazon Route 53 public hosted zones"
resource "aws_route53_zone" "my_zone" {
  #checkov:skip=CKV2_AWS_38: "Ensure Domain Name System (DNS) query logging is enabled for Amazon Route 53 hosted zones"
  #checkov:skip=CKV2_AWS_39: "Ensure Domain Name System Security Extensions (DNSSEC) signing is enabled for Amazon Route 53 public hosted zones"
  name = "bloodconnect.net"
}
