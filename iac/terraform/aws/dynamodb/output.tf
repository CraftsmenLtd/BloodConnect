output "dynamodb_table_arn" {
  value = aws_dynamodb_table.blood_connect_data.arn
}

output "dynamodb_table_name" {
  value = aws_dynamodb_table.blood_connect_data.name
}

output "dynamodb_table_stream_arn" {
  value = aws_dynamodb_table.blood_connect_data.stream_arn
}

output "dynamodb_chat_table_arn" {
  value = aws_dynamodb_table.blood_connect_chat.arn
}

output "dynamodb_chat_table_name" {
  value = aws_dynamodb_table.blood_connect_chat.name
}

output "dynamodb_chat_table_stream_arn" {
  value = aws_dynamodb_table.blood_connect_chat.stream_arn
}