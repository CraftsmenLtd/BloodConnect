output "lambda_metadata" {
  description = "Lambda metadata for scheduler service"
  value = []
}

output "schedule_group_name" {
  description = "EventBridge Scheduler group name"
  value       = aws_scheduler_schedule_group.scheduler_group.name
}

output "schedule_role_arn" {
  description = "EventBridge Scheduler execution role ARN"
  value       = aws_iam_role.scheduler_execution_role.arn
}