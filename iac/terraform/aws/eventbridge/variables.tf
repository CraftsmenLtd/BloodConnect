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

variable "donation_request_queue_arn" {
  type        = string
  description = "ARN of the donor search SQS queue"
}

variable "donation_status_manager_queue_arn" {
  type        = string
  description = "ARN of the donation status manager SQS queue"
}

variable "monitor_donation_request_lambda_arn" {
  type        = string
  description = "ARN of the monitoring donation request lambda"
}
