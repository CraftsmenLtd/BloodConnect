output "donor_search_retry_queue_arn" {
  value = aws_sqs_queue.donor_search_retry_queue.arn
}

output "donor_search_retry_queue_url" {
  value = aws_sqs_queue.donor_search_retry_queue.url
}
