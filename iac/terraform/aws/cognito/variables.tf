variable "environment" {
  type        = string
  description = "Deployment environment"
}

variable "bloodconnect_domain" {
  type        = string
  description = "Domain name for the BloodConnect application"
}

variable "lambda_runtime" {
  type        = string
  description = "Lambda Runtime"
  default     = "nodejs20.x"
}

variable "verified_domain_arn" {
  type        = string
  description = "ARN of the verified domain for email sending"
}

variable "dynamodb_table_arn" {
  type        = string
  description = "ARN of the DynamoDB tablee"
}

variable "password_length" {
  type        = number
  description = "Minimum length of passwords"
  default     = 10
}
