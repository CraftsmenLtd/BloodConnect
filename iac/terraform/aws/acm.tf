data "aws_acm_certificate" "certificate" {
  domain      = var.bloodconnect_domain
  statuses    = ["ISSUED"]
  most_recent = true
  provider    = aws.us-east-1
}
