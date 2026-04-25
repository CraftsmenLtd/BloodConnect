variable "domain_name" {
  type        = string
  description = "Root domain name (e.g. bloodconnect.net)"
}

variable "poc_emails" {
  type        = string
  description = "Comma-separated child safety POC emails e.g. a@example.com,b@example.com"
  default     = ""
}
