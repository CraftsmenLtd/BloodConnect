resource "aws_cloudwatch_log_group" "cloudtrail_log_group" {
  #checkov:skip=CKV_AWS_338: "Ensure CloudWatch log groups retains logs for at least 1 year"
  name              = "${var.environment}-route53-cloudtrail-logs"
  retention_in_days = 30
}
