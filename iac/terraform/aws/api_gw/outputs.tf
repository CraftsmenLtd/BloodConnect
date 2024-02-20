output "id" {
  value = element(coalescelist(aws_api_gateway_resource.api_path.*.id, [var.parent_api_id]), 0)
}

output "path" {
  value = var.api_path
}

output "methods" {
  value = var.methods
}

output "lambda_function_arn" {
  value = var.lambda_function_arn
}