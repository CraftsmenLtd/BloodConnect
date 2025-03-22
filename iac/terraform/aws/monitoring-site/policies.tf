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
          aws_s3_bucket.monitoring_site.arn,
          "${aws_s3_bucket.monitoring_site.arn}/${local.monitor_donation_request_s3_path_prefix}/*"
        ]
      }
    ]
  }
}
