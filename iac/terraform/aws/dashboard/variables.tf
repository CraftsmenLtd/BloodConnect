variable "environment" {
  type        = string
  description = "Deployment environment"
}

variable "donor_search_lambda_name" {
  type        = string
  description = "Donor search lambda name"
}

variable "create_user_lambda_name" {
  type        = string
  description = "Create user lambda name"
}
