locals {
  policies = {
    common_policies = [
      {
        sid = "LogPolicy"
        actions = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        resources = [
          "arn:aws:logs:*:*:*"
        ]
      }
    ],
    s3_policy = [
      {
        sid = "S3Policy"
        actions = [
          "s3:*"
        ]
        resources = [
          "${aws_s3_bucket.monitor_donation_request.arn}",
          "${aws_s3_bucket.monitor_donation_request.arn}/*"
        ]
      }
    ]
  }
}
