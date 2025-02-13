variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "queue_name" {
  description = "Name of the SQS queue"
  type        = string
}

variable "visibility_timeout_seconds" {
  description = "Visibility timeout for the queue"
  type        = number
  default     = 120
}

variable "max_receive_count" {
  description = "Max receive count for dead-letter queue policy"
  type        = number
  default     = 5
}

variable "enable_lambda_event_source" {
  description = "Enable Lambda event source mapping"
  type        = bool
  default     = false
}

variable "lambda_function_arn" {
  description = "Lambda function ARN for event source mapping"
  type        = string
  default     = ""
}

variable "batch_size" {
  description = "Batch size for Lambda event source mapping"
  type        = number
  default     = 10
}