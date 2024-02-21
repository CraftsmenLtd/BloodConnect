variable "environment" {
  type        = string
  description = "Deployment environment"
}

variable "lambda_runtime" {
  type        = string
  description = "Lambda Runtime"
  default = "nodejs20.x"
}

variable "api_gw_rest_api_id" {
  type = string
  description = "API Gateway REST API id"
}

variable "api_gw_root_resource_id" {
  type = string
  description = "API Gateway REST API Root resource id"
}
