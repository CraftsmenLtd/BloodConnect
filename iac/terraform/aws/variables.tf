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
  description = "aws budget settings"
  default = {
    set_budget = false
    amount     = 0
    threshold  = 70
    emails     = []
  }
}

variable "openapi_files_path" {
  type        = string
  description = "OpenApi files path"
  default     = "../../../openapi"
}

variable "openapi_version" {
  type        = string
  description = "OpenApi version"
  default     = "v1"
}

variable "merged_openapi_file_name" {
  type        = string
  description = "Merged OpenAPI file"
  default     = "mergedOpenApi.json"
}
