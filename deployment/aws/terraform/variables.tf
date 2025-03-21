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

variable "facebook_client_id" {
  description = "Facebook OAuth App ID as per https://developers.facebook.com/apps/"
  type        = string
}

variable "facebook_client_secret" {
  description = "Facebook OAuth App Secret as per https://developers.facebook.com/apps/"
  type        = string
  sensitive   = true
}

variable "firebase_token_s3_url" {
  description = "S3 URL for Android Firebase token file"
  type        = string
}

variable "google_maps_api_key" {
  description = "google maps api key"
  type        = string
  sensitive   = true
}

variable "mapbox_public_key" {
  description = "mapbox public key"
  type        = string
  sensitive   = true
}
