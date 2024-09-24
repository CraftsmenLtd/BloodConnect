variable "environment" {
  type        = string
  description = "Deployment environment and resource prefix"
}

variable "bloodconnect_domain" {
  description = "Bloodconnect root domain"
  type        = string
}

variable "route53_hosted_zone_id" {
  description = "Route53 hosted zone id"
  type        = string
}

variable "cloudfront_header_response_policy_id" {
  description = "Cloudfront Managed response header policy id for CORS policy"
  type        = string
  default     = "5cc3b908-e619-4b99-88e5-2cf7f45965bd"
  # https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-managed-response-headers-policies.html
}

variable "acm_certificate_arn" {
  description = "ARN forn bloodconnect SSL certification"
  type        = string
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