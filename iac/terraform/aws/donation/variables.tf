variable "environment" {
  type        = string
  description = "Deployment environment"
}

variable "lambda_archive_path" {
  type        = string
  description = "Path to the Lambda function zip archives"
}

variable "dynamodb_table_arn" {
  type        = string
  description = "ARN of the DynamoDB table"
}
