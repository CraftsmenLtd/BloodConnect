variable "environment" {
  type        = string
  description = "Deployment environment"
}

variable "lambda_runtime" {
  type        = string
  description = "Lambda Runtime"
  default     = "nodejs20.x"
}

# variable "verified_domain_arn" {
#   type = string
# }

variable "dynamodb_table_arn" {
  type = string
}

variable "domain_name" {
  type = string
}