output "donation_request_queue_arn" {
  value = module.donation_request_queue.queue_arn
}

output "donation_status_manager_queue_arn" {
  value = module.donation_status_manager_queue.queue_arn
}