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

variable "max_geohash_length" {
  type        = number
  description = "geohash length for calculation"
  default     = 8
}

variable "max_geohash_storage" {
  type        = number
  description = "total geohash to store per file"
  default     = 582542
}
