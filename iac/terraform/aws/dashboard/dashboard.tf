resource "aws_cloudwatch_dashboard" "dashboard" {
  dashboard_name = "${var.environment}-dashboard"
  dashboard_body = jsonencode(
    {
      widgets = [
        {
          type   = "log"
          x      = 0
          y      = 0
          height = 6
          width  = 24
          properties = {
            query  = <<-EOT
              SOURCE '/aws/lambda/${var.donor_search_lambda_name}'
              | fields @timestamp, requestPostId, msg
              | filter ispresent(requestPostId) and requestPostId != ""
              | filter msg like /checking targeted execution time/
              | stats count(*) as count by requestPostId
              | sort count desc
              | limit 20
            EOT
            region = data.aws_region.current.name
            title  = "Donor Search Invocation Count by Request ID"
            view   = "table"
          }
        },
      ]
    }
  )
}
