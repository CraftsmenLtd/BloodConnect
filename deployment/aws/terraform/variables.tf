variable "aws_environment" {
  type        = string
  description = "AWS deployment environment"
}

variable "bloodconnect_domain" {
  type        = string
  description = "Bloodconnect root domain"
}

variable "google_client_id" {
  description = "Google OAuth Client ID as per https://console.cloud.google.com/apis/credentials?project=<your-project>"
  type        = string
}

variable "google_client_secret" {
  description = "Google OAuth Client Secret as per https://console.cloud.google.com/apis/credentials?project=<your-project>"
  type        = string
  sensitive   = true
}
