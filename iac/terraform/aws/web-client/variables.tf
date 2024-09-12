locals {
  api_subdomain_name = "api.${var.domain_name}"
  www_domain         = "www.${var.domain_name}"
}

variable "bucket_name" {
  description = "S3 bucket name to store the static website"
  type        = string
  default     = "blood-connect-application"
}

variable "domain_name" {
  description = "The domain name for the web client"
  type        = string
  default     = "bloodconnect.net"
}

variable "cloudfront_response_policy_id" {
  description = "Cloudfront Managed response header policy id for CORS policy"
  type        = string
  default     = "5cc3b908-e619-4b99-88e5-2cf7f45965bd"
}