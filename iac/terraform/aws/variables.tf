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

variable "hosted_zone_id" {
    description = "hosted zone id for bloodconnect.net"
    type = string
}

variable "openapi_directory" {
  type        = string
  description = "OpenApi files path"
  default     = "../../../openapi"
}

variable "openapi_version" {
  type        = string
  description = "OpenApi version"
  default     = "v1"
}

variable "combined_openapi_file" {
  type        = string
  description = "Combined OpenAPI file"
  default     = "combined-openapi.json"
}
variable "hosted_zone_id" {
    description = "hosted zone id for bloodconnect.net"
    type = string
}
