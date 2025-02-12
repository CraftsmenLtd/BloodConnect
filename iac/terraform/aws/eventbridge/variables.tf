variable "environment" {
  type        = string
  description = "Deployment environment"
}

variable "dynamodb_table_stream_arn" {
  type        = string
  description = "ARN of the DynamoDB table stream"
}

variable "dynamodb_table_arn" {
  type        = string
  description = "ARN of the DynamoDB table"
}

variable "donor_search_queue_arn" {
  type        = string
  description = "ARN of the donor search SQS queue"
}

variable "donation_status_manager_queue_arn" {
  type        = string
  description = "ARN of the donation status manager SQS queue"
}
