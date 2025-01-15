resource "aws_s3_bucket" "monitor_donation_request" {
  bucket = "${var.environment}-monitor-donation-request-bucket"
}

resource "aws_s3_bucket_policy" "monitor_donation_request" {
  bucket = aws_s3_bucket.monitor_donation_request.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.monitor_donation_request.arn}/*"
      }
    ]
  })
}
