resource "aws_cloudwatch_event_rule" "blood_request_stream_rule" {
  name        = "${var.environment}-blood-request-stream-rule"
  description = "Rule to capture blood request post events from DynamoDB stream"

  event_pattern = jsonencode({
    source      = ["aws.dynamodb"]
    detail-type = ["AWS API Call via CloudTrail"]
    detail = {
      eventSource = ["dynamodb.amazonaws.com"]
      eventName   = ["INSERT", "MODIFY"]
      dynamodb = {
        Keys = {
          PK = {
            S = [{prefix = "BLOOD_REQ#"}]
          }
          SK = {
            S = [{prefix = "BLOOD_REQ#"}]
          }
        }
      }
    }
  })
}

resource "aws_cloudwatch_event_target" "blood_request_sqs_target" {
  rule      = aws_cloudwatch_event_rule.blood_request_stream_rule.name
  target_id = "SendToBloodRequestQueue"
  arn       = aws_sqs_queue.donor_search_queue.arn
}