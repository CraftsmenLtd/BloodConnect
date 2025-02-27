variable "environment" {
  type        = string
  description = "Deployment environment"
}

variable "google_maps_api_key" {
  type        = string
  description = "google maps api key"
  sensitive   = true
}
