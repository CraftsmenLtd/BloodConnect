output "dynamodb_table_arn" {
  value = aws_dynamodb_table.blood_connect_data.arn
}

output "dynamodb_table_name" {
  value = "${var.environment}-${var.table_name}"
}
