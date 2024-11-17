output "donor_search_queue_arn" {
  value = aws_sqs_queue.donor_search_queue.arn
}

output "donation_status_manager_queue_arn" {
  value = aws_sqs_queue.donation_status_manager_queue.arn
}

output "donor_search_state_machine_arn" {
  value = aws_sfn_state_machine.donor_search_state_machine.arn
}
