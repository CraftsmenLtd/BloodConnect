variable "environment" {
  type        = string
  description = "Deployment environment"
}

variable "dynamodb_table_arn" {
  type        = string
  description = "ARN of the DynamoDB table"
}

variable "firebase_token_s3_url" {
  description = "S3 URL for Android Firebase token file"
  type        = string
}

variable "donor_search_state_machine_arn" {
  type = string
}
