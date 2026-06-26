variable "environment" {
  type        = string
  description = "Deployment environment"
}

variable "dynamodb_chat_table_arn" {
  type        = string
  description = "ARN of the chat DynamoDB table"
}

variable "cognito_user_pool_arn" {
  type        = string
  description = "ARN of the Cognito user pool used to authorize websocket connections"
}

variable "push_notification_queue" {
  description = "Push notification SQS queue used for offline message delivery"
}
