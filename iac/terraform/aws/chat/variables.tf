variable "environment" {
  type        = string
  description = "Deployment environment"
}

variable "dynamodb_chat_table_arn" {
  type        = string
  description = "ARN of the chat DynamoDB table"
}
