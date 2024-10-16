output "ses_domain_identity_arn" {
  value       = aws_ses_domain_identity.verified_domain.arn
  description = "The ARN of the verified SES domain"
}
