resource "aws_cloudwatch_log_group" "donation_request_pipe_log_group" {
  #checkov:skip=CKV_AWS_338: "Ensure CloudWatch log groups retains logs for at least 1 year"
  #checkov:skip=CKV_AWS_158: "Ensure that CloudWatch Log Group is encrypted by KMS"
  name              = "/aws/vendedlogs/pipes/${var.environment}-donation-request-pipe"
  retention_in_days = 30
}

resource "aws_cloudwatch_log_group" "donation_accept_pipe_log_group" {
  #checkov:skip=CKV_AWS_338: "Ensure CloudWatch log groups retains logs for at least 1 year"
  #checkov:skip=CKV_AWS_158: "Ensure that CloudWatch Log Group is encrypted by KMS"
  name              = "/aws/vendedlogs/pipes/${var.environment}-donation-accept-pipe"
  retention_in_days = 30
}

resource "aws_cloudwatch_log_group" "donation_request_monitoring_pipe_log_group" {
  #checkov:skip=CKV_AWS_338: "Ensure CloudWatch log groups retains logs for at least 1 year"
  #checkov:skip=CKV_AWS_158: "Ensure that CloudWatch Log Group is encrypted by KMS"
  name              = "/aws/vendedlogs/pipes/${var.environment}-donation-request-monitoring-pipe"
  retention_in_days = 30
}
