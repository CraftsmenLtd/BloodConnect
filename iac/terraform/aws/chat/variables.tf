variable "environment" {
  type        = string
  description = "Deployment environment"
}

variable "dynamodb_table_arn" {
  type        = string
  description = "ARN of the shared BloodConnect DynamoDB table"
}

variable "dynamodb_table_stream_arn" {
  type        = string
  description = "ARN of the DynamoDB table stream"
}

variable "notification_queue_arn" {
  type        = string
  description = "ARN of the push-notification SQS queue (reused for CHAT_MESSAGE)"
}

variable "notification_queue_url" {
  type        = string
  description = "URL of the push-notification SQS queue"
}

variable "cognito_user_pool_id" {
  type        = string
  description = "Cognito User Pool ID for the WebSocket authorizer"
}

variable "cognito_client_id" {
  type        = string
  description = "Cognito App Client ID for the WebSocket authorizer"
}

variable "log_retention_in_days" {
  type    = number
  default = 90
}
