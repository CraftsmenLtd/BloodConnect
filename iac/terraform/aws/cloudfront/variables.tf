variable "environment" {
  type        = string
  description = "Deployment environment and resource prefix"
}

variable "acm_certificate_arn" {
  description = "ARN forn bloodconnect SSL certification"
  type        = string
}

variable "static_site_bucket" {
  description = "The static site S3 bucket"
  type = object({
    id                          = string
    arn                         = string
    bucket_regional_domain_name = string
  })
}

variable "failover_bucket" {
  description = "The failover S3 bucket"
  type = object({
    id                          = string
    arn                         = string
    bucket_regional_domain_name = string
  })
}

variable "log_store_bucket" {
  description = "The log store S3 bucket"
  type = object({
    id                          = string
    arn                         = string
    bucket_regional_domain_name = string
  })
}

variable "rest_api_id" {
  description = ""
  type        = string
}

variable "cloudfront_header_response_policy_id" {
  description = "Cloudfront Managed response header policy id for CORS policy"
  type        = string
  default     = "5cc3b908-e619-4b99-88e5-2cf7f45965bd"
  # https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-managed-response-headers-policies.html
}

variable "cloudfront_distribution_origin_id" {
  description = "Origin id used in origin block in aws cloudfront distribution"
  type        = string
  default     = "S3PrimaryOrigin"
}

variable "cloudfront_distribution_failover_origin_id" {
  description = "Origin Id for failover bucket on cloudfront distribution"
  type        = string
  default     = "S3FailoverOrigin"
}

variable "cloudfront_access_region" {
  description = "Request allowed from regions on cloudfront"
  type        = list(string)
  default     = ["BD"]
}

variable "bloodconnect_environment_domain" {
  type        = string
  description = "Bloodconnect domain for this environment"
}
