variable "environment" {
  type        = string
  description = "Deployment environment"
}

variable "bloodconnect_domain" {
  type        = string
  description = "Domain name for the BloodConnect application"
}

variable "verified_domain_arn" {
  type        = string
  description = "ARN of the verified domain for sending emails"
}

variable "dynamodb_table_arn" {
  type        = string
  description = "ARN of the DynamoDB table"
}

variable "password_length" {
  type        = number
  description = "Minimum length of passwords"
  default     = 10
}

variable "google_client_id" {
  description = "Google OAuth Client ID"
  type        = string

  validation {
    condition     = length(var.google_client_id) > 0
    error_message = "The google_client_id value must be set."
  }
}

variable "google_client_secret" {
  description = "Google OAuth Client Secret"
  type        = string

  validation {
    condition     = length(var.google_client_secret) > 0
    error_message = "The google_client_secret value must be set."
  }
}

variable "facebook_client_id" {
  description = "Facebook OAuth App ID as per https://developers.facebook.com/apps/"
  type        = string
  validation {
    condition     = length(var.facebook_client_id) > 0
    error_message = "The facebook_client_id value must be set."
  }
}

variable "facebook_client_secret" {
  description = "Facebook OAuth App Secret as per https://developers.facebook.com/apps/"
  type        = string
  validation {
    condition     = length(var.facebook_client_secret) > 0
    error_message = "The facebook_client_secret value must be set."
  }
}

variable "acm_certificate_arn" {
  type        = string
  description = "ARN for bloodconnect SSL certification"
}

variable "hosted_zone_id" {
  type        = string
  description = "Route53 zone ID"
}
