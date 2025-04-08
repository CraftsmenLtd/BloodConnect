variable "environment" {
  type        = string
  description = "Deployment environment"
}

variable "max_geohash_length" {
  type        = number
  description = "geohash length for calculation"
  default     = 8
}

variable "max_geohash_prefix_length" {
  type        = number
  description = "geohash length for calculation"
  default     = 4
}

variable "max_geohash_storage" {
  type        = number
  description = "total geohash to store per file"
  default     = 582542
}

variable "mapbox_public_key" {
  type        = string
  description = "mapbox public key"
  sensitive   = true
}

variable "site_path" {
  type        = string
  description = "site path to keep assets in"
}

variable "cognito_user_pool_id" {
  type        = string
  description = "id for app authentication"
}

variable "cognito_app_client_id" {
  type        = string
  description = "id for app authentication"
}

variable "cognito_identity_pool_id" {
  type        = string
  description = "id for app authentication"
}

variable "cognito_custom_domain_name" {
  type        = string
  description = "cognito domain for oauth logins"
}

variable "maintainers_role" {
  type        = string
  description = "role name to attach s3 access policies for maintainers"
}

variable "bloodconnect_domain" {
  type        = string
  description = "domain for app hosted"
}
