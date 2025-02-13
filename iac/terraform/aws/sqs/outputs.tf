output "queue_id" {
  value = aws_sqs_queue.this.id
}

output "queue_arn" {
  value = aws_sqs_queue.this.arn
}

output "queue_url" {
  value = aws_sqs_queue.this.url
}

output "dlq_id" {
  value = aws_sqs_queue.dlq.id
}

output "dlq_arn" {
  value = aws_sqs_queue.dlq.arn
}