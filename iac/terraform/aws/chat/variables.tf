variable "environment" {
  type        = string
  description = "Deployment environment"
}

variable "dynamodb_table_arn" {
  type        = string
  description = "ARN of the DynamoDB table"
}

variable "dynamodb_table_stream_arn" {
  type        = string
  description = "ARN of the DynamoDB table stream feeding the chat channel pipes"
}

variable "push_notification_queue" {
  description = "Push notification SQS queue (for offline CHAT_MESSAGE fallback)"
}

variable "cognito_user_pool_id" {
  type        = string
  description = "Cognito user pool id the $connect authorizer validates JWTs against"
}

variable "cognito_app_client_id" {
  type        = string
  description = "Cognito app client id the $connect authorizer validates JWTs against"
}
