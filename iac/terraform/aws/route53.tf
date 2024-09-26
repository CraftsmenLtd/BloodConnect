data "aws_route53_zone" "main" {
  #checkov:skip=CKV2_AWS_39: "Ensure Domain Name System (DNS) query logging is enabled for Amazon Route 53 hosted zones"
  #checkov:skip=CKV2_AWS_38: "Ensure Domain Name System Security Extensions (DNSSEC) signing is enabled for Amazon Route 53 public hosted zones"
  name         = var.bloodconnect_domain
  private_zone = false
}
