variable "domain_name" {
  default     = "bloodconnect.net"
  description = "bloodconnect domain name"
  type        = string
}

variable "domain_validation_method" {
  default     = "DNS"
  description = "domain validation method"
  type        = string
}

variable "hosted_zone_id" {
  description = "hosted zone id for bloodconnect.net"
  type        = string
}
