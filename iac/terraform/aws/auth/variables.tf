variable "environment" {
  type        = string
  description = "Deployment environment"
}

variable "user_pool_id" {
  type        = string
  description = "Cognito user pool ID"
}

variable "client_id" {
  type        = string
  description = "Cognito client ID"
}
