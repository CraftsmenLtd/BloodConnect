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
          "s3:HeadObject",
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:CreateMultipartUpload",
          "s3:UploadPart",
          "s3:UploadPartCopy",
          "s3:CompleteMultipartUpload"
        ]
        resources = [aws_s3_bucket.monitor_donation_request.id]
      }
    ]
  }
}
