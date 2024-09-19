locals {
  web-client-domain = var.environment == "master" ? var.bloodconnect_domain : "${var.environment}.${var.bloodconnect_domain}"
}

variable "environment" {
  type        = string
  description = "Deployment environment and resource prefix"
}

variable "bloodconnect_domain" {
  description = "Bloodconnect root domain"
  type        = string
}

variable "cloudfront_header_response_policy_id" {
  description = "Cloudfront Managed response header policy id for CORS policy"
  type        = string
  default     = "5cc3b908-e619-4b99-88e5-2cf7f45965bd"
}

variable "acm_certificate_arn" {
  description = "ARN forn bloodconnect SSL certification"
  type        = string
}

variable "cloudfront_distribution_origin_id" {
  description = "Origin id used in origin block in aws cloudfron distribution"
  type = string
  default = "S3PrimaryOrigin"
}

variable "cloudfront_distribution_failover_origin_id" {
  description  = "Origin Id for failover bucket on cloudfront distribution"
  type = string
  default = "S3FailoverOrigin"
}