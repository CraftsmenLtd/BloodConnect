variable "environment" {
  type        = string
  description = "Deployment environment"
}

variable "dynamodb_table_arn" {
  type        = string
  description = "ARN of the DynamoDB table"
}

variable "donor_search_sf_arn" {
  type        = string
  description = "donor search Step Function arn"
}
