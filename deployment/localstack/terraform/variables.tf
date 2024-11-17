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

variable "facebook_client_id" {
  description = "Facebook OAuth App ID as per https://developers.facebook.com/apps/"
  type        = string
  default     = "dummy_client_id_for_localstack"
}

variable "facebook_client_secret" {
  description = "Facebook OAuth App Secret as per https://developers.facebook.com/apps/"
  type        = string
  sensitive   = true
  default     = "dummy_client_secret_for_localstack"
}

variable "firebase_token_s3_url" {
  description = "S3 URL for Android Firebase token file"
  type        = string
  default     = "dummy_client_secret_for_localstack"
}
