variable "environment" {
  type        = string
  description = "Deployment environment"
}

variable "user_pool_id" {
  type        = string
  description = "Cognito user pool ID"
}

variable "user_pool_arn" {
  type        = string
  description = "Cognito user pool arn"
}

variable "client_id" {
  type        = string
  description = "Cognito client ID"
}

variable "dynamodb_table_arn" {
  type        = string
  description = "dynamodb table arn"
}
