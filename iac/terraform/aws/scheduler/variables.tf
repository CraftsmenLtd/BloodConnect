variable "environment" {
  description = "Environment name"
  type        = string
}

variable "dynamodb_table_arn" {
  description = "DynamoDB table ARN"
  type        = string
}

variable "donor_search_lambda_arn" {
  description = "Donor search lambda ARN"
  type        = string
}