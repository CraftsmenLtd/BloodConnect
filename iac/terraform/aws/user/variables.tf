variable "environment" {
  type        = string
  description = "Deployment environment"
}

variable "dynamodb_table_arn" {
  type        = string
  description = "ARN of the DynamoDB table"
}

variable "min_months_between_donations" {
  type        = string
  description = "After donation unavailable period"
  default     = 4
}

variable "bloodconnect_environment_domain" {
  type        = string
  description = "Environment-aware BloodConnect domain used to build avatar CDN URLs"
}

variable "media_bucket_name" {
  type        = string
  description = "Name of the shared media bucket used to store profile pictures"
}

variable "media_bucket_arn" {
  type        = string
  description = "ARN of the shared media bucket used to store profile pictures"
}

variable "media_path" {
  type        = string
  description = "Top-level media key prefix, also the CloudFront path pattern serving the media bucket"
  default     = "media"
}
