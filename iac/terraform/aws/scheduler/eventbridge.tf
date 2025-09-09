resource "aws_scheduler_schedule_group" "scheduler_group" {
  name = "${var.environment}-scheduler-group"
}