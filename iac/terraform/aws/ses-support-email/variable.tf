variable "domain_name" {
  type        = string
  description = "Root domain name (e.g. bloodconnect.net)"
}

variable "poc_emails" {
  type        = list(string)
  description = "Child safety POC emails — all addresses receive forwarded support@ emails via SNS"
}
