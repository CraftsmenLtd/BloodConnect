resource "aws_s3_bucket" "static_site" {
  bucket = var.bucket_name

  tags = {
    Name = "StaticSiteBucket"
  }
}

resource "aws_s3_bucket_policy" "bucket_access_policy" {
  bucket = aws_s3_bucket.static_site.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action    = "s3:GetObject"
        Effect    = "Allow"
        Principal = {
          AWS = "${aws_cloudfront_origin_access_identity.oai.iam_arn}"
        }
        Resource  = "${aws_s3_bucket.static_site.arn}/*"
      }
    ]
  })
}
