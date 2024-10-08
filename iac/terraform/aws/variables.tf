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

variable "lambda_archive_path" {
  type        = string
  description = "Path to the Lambda function zip archives"
  default     = "${path.module}/../../../../core/services/aws/.build/zips"
}
