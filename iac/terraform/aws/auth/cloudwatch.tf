resource "aws_cloudwatch_log_group" "apigateway_logs" {
  #checkov:skip=CKV_AWS_158: "Ensure that CloudWatch Log Group is encrypted by KMS"
  #checkov:skip=CKV_AWS_338: "Ensure CloudWatch log groups retains logs for at least 1 year"
  name = "${var.environment}-apigateway-logs"
  retention_in_days = 30
}