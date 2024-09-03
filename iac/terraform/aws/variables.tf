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