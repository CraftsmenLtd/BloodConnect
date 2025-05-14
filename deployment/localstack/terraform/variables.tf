variable "google_client_id" {
  description = "Google OAuth Client ID"
  type        = string
  default     = "client-secret"
}

variable "google_client_secret" {
  description = "Google OAuth Client Secret"
  type        = string
  sensitive   = true
  default     = "client-secret"
}

variable "facebook_client_id" {
  description = "Facebook OAuth App ID as per https://developers.facebook.com/apps/"
  type        = string
  default     = "client-secret"
}

variable "facebook_client_secret" {
  description = "Facebook OAuth App Secret as per https://developers.facebook.com/apps/"
  type        = string
  sensitive   = true
  default     = "client-secret"
}

variable "google_maps_api_key" {
  description = "google maps api key"
  type        = string
  sensitive   = true
  default     = "api-secret"
}
