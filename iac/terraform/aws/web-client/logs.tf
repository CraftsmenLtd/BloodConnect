resource "aws_cloudwatch_log_group" "cloudtrail_log_group" {
  name              = "route53-cloudtrail-logs"
  retention_in_days = 30
}
