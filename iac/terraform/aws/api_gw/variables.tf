variable "environment" {
  type = string
}

variable "region" {
  type = string
}

variable "rest_api_id" {
  type = string
}

variable "parent_api_id" {
  type = string
}

variable "api_path" {
  type    = string
  default = ""
}

variable "methods" {
  type    = list(string)
  default = []
}

variable "method_request_params" {
  type    = map(string)
  default = {}
}

variable "api_key_required" {
  default = true
}

variable "enable_lambda_integration" {
  default = false
}

variable "enable_s3_integration" {
  default = false
}

variable "s3_integration_role" {
  type    = string
  default = ""
}

variable "s3_integration_bucket" {
  type    = string
  default = ""
}

variable "s3_integration_prefix" {
  type    = string
  default = ""
}

variable "lambda_function_arn" {
  type    = string
  default = ""
}
