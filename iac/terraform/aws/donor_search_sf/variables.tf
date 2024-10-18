variable "environment" {
  type        = string
  description = "Deployment environment"
}

variable "dynamodb_table_arn" {
  type        = string
  description = "ARN of the DynamoDB table"
}

variable "donor_search_retry_queue_arn" {
  type        = string
  description = "Donor search retry queue arn"
}

variable "donor_search_retry_queue_url" {
  type        = string
  description = "Donor search retry queue url"
}
