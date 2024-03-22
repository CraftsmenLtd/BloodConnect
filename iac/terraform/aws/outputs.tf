output "invoke_base_url" {
  value = aws_api_gateway_deployment.api_deployment.invoke_url
}

output "rest_api_id" {
  value = aws_api_gateway_rest_api.rest_api.id
}

output "api_deployment_stage_name" {
  value = aws_api_gateway_deployment.api_deployment.stage_name
}