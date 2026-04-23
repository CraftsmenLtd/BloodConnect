variable "domain_name" {
  type        = string
  description = "Domain name to configure SES"
}

variable "poc_email" {
  type        = string
  description = "Child safety point of contact personal email — inbound support@ emails forwarded here via SNS"
  sensitive   = true
}
