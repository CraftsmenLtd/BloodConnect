output "dynamodb_table_arn" {
  value = aws_dynamodb_table.blood_connect_data.arn
}

output "dynamodb_table_name" {
  value = aws_dynamodb_table.blood_connect_data.name
}

output "dynamodb_table_stream_arn" {
  value = aws_dynamodb_table.blood_connect_data.stream_arn
}