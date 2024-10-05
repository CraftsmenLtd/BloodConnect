variable "google_client_id" {
  description = "Google OAuth Client ID"
  type        = string
  default     = "dummy_client_id_for_localstack"
}

variable "google_client_secret" {
  description = "Google OAuth Client Secret"
  type        = string
  sensitive   = true
  default     = "dummy_client_secret_for_localstack"
}