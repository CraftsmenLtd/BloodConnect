variable "environment" {
  type        = string
  description = "Deployment environment"
}

variable "lambda_runtime" {
  type        = string
  description = "Lambda Runtime"
  default     = "nodejs20.x"
}

variable "lambda_architecture" {
  type        = list(string)
  description = "Lambda ArchitectureInfo"
  default     = ["arm64"]
}

variable "lambda_option" {
  description = "Lambda function configuration"
  type = object({
    name     = string
    zip_path = string
    handler  = string
    statement = list(object({
      sid       = string
      actions   = list(string)
      resources = list(string)
    }))
    env_variables = map(string)
    timeout       = optional(number, 60)
    memory_size   = optional(number, 128)
  })
}