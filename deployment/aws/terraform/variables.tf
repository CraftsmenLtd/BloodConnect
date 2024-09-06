variable "aws_environment" {
  type        = string
  description = "AWS deployment environment"
}

variable "domain_name" {
  default = "bloodconnect.net"
  type = string
  description = "Domain name for bloodconnect"
}

variable "hosted_zone_id" {
  description = "hosted zone id for bloodconnect.net"
  type        = string
}
