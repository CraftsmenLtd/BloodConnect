resource "aws_ses_domain_identity" "verified_domain" {
  domain = var.domain_name
}

data "aws_route53_zone" "selected" {
  name         = aws_ses_domain_identity.verified_domain.domain
  private_zone = false
}

resource "aws_route53_record" "ses_verification_record" {
  zone_id = data.aws_route53_zone.selected.zone_id
  name    = "_amazonses.${aws_ses_domain_identity.verified_domain.domain}"
  type    = "TXT"
  ttl     = 600
  records = [aws_ses_domain_identity.verified_domain.verification_token]
}

resource "aws_ses_domain_dkim" "domain_dkim" {
  domain = aws_ses_domain_identity.verified_domain.domain
}

resource "aws_route53_record" "dkim_records" {
  count   = 3
  zone_id = data.aws_route53_zone.selected.zone_id
  name    = "${aws_ses_domain_dkim.domain_dkim.dkim_tokens[count.index]}._domainkey"
  type    = "CNAME"
  ttl     = 600
  records = ["${aws_ses_domain_dkim.domain_dkim.dkim_tokens[count.index]}.dkim.amazonses.com"]
}
