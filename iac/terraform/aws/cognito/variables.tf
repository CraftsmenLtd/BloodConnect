variable "environment" {
  type        = string
  description = "Deployment environment"
}

variable "bloodconnect_domain" {
  type = string
}

variable "lambda_runtime" {
  type        = string
  description = "Lambda Runtime"
  default     = "nodejs20.x"
}

variable "verified_domain_arn" {
  type = string
}

variable "dynamodb_table_arn" {
  type = string
}

variable "password_length" {
  type    = number
  default = 10
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
