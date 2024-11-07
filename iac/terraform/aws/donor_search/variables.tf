variable "environment" {
  type        = string
  description = "Deployment environment"
}

variable "dynamodb_table_arn" {
  type        = string
  description = "ARN of the DynamoDB table"
}

variable "donor_search_max_retry_count" {
  type        = string
  description = "donor search maximum retry count"
  default     = 10
}
