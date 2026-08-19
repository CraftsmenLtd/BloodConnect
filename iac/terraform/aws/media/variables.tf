variable "environment" {
  type        = string
  description = "Deployment environment"
}

variable "media_path" {
  type        = string
  description = "Top-level media key prefix, also the CloudFront path pattern serving this bucket"
  default     = "media"
}
