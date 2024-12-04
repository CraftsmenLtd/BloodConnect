variable "environment" {
  type        = string
  description = "Deployment environment"
}

variable "dynamodb_table_arn" {
  type        = string
  description = "ARN of the DynamoDB table"
}

variable "min_months_between_donations" {
  type        = string
  description = "After donation unavailable period"
  default     = 4
}
