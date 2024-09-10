variable "environment" {
  type        = string
  description = "Deployment environment"
}

variable "lambda_runtime" {
  type        = string
  description = "Lambda Runtime"
  default     = "nodejs20.x"
}

variable "user_pool_name" {
  type    = string
  default = "user_pool"
}

variable "verified_domain_arn" {
  type = string
}

variable "table_arn" {
  type = string
}

variable "domain_name" {
  type = string
}

variable "table_name" {
  type = string
}
