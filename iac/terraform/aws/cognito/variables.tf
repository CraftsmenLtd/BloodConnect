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

variable "lambda_archive_path" {
  type        = string
  description = "Path to the Lambda function zip archives"
}

variable "bloodconnect_environment_domain" {
  type = string
  description = "Bloodconnect Environment Domain"
}