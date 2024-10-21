variable "environment" {
  type        = string
  description = "Deployment environment"
}

variable "billing_tag" {
  type        = string
  description = "AWS billing tag value"
  default     = "billing"
}

variable "budget_settings" {
  type = object({
    set_budget = bool
    amount     = number
    threshold  = number
    emails     = list(string)
  })
  description = "AWS budget settings"
  default = {
    set_budget = false
    amount     = 0
    threshold  = 70
    emails     = []
  }
}

variable "openapi_directory" {
  type        = string
  description = "OpenApi files path"
  default     = "../../../openapi"
}

variable "api_version" {
  type        = string
  description = "Api version"
  default     = "v1"
}

variable "combined_openapi_file" {
  type        = string
  description = "Combined OpenAPI file"
  default     = "openapi.json"
}

variable "bloodconnect_domain" {
  type        = string
  description = "Bloodconnect root domain"
}

variable "google_client_id" {
  description = "Google OAuth Client ID"
  type        = string
}

variable "google_client_secret" {
  description = "Google OAuth Client Secret"
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

variable "api_quota_limit" {
  description = "The maximum number of requests that can be made in a given time period"
  type        = number
  default     = 10
}

variable "api_quota_offset" {
  description = "The number of requests subtracted from the given limit in the initial time period"
  type        = number
  default     = 0
}

variable "api_quota_period" {
  description = "The time period in which the limit applies. Valid values are 'DAY', 'WEEK' or 'MONTH'"
  type        = string
  default     = "DAY"
}

variable "api_throttle_burst_limit" {
  description = "The API Gateway throttle burst limit"
  type        = number
  default     = 5
}

variable "api_throttle_rate_limit" {
  description = "The API Gateway throttle rate limit"
  type        = number
  default     = 10
}