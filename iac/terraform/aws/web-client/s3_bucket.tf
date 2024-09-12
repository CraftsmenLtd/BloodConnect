resource "aws_s3_bucket" "static_site" {
  bucket = var.bucket_name

  tags = {
    Name = "StaticSiteBucket"
  }
}

resource "aws_s3_bucket" "log_store" {
  bucket = "${var.domain_name}-log-store"

  tags = {
    Name = "log-bucket"
  }
}

resource "aws_s3_bucket" "cloudfront_failover_bucket" {
  bucket = "${var.domain_name}-failover"
}

resource "aws_s3_bucket_policy" "bucket_access_policy" {
  bucket = aws_s3_bucket.static_site.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "s3:GetObject"
        Effect = "Allow"
        Principal = {
          AWS = "${aws_cloudfront_origin_access_identity.oai.iam_arn}"
        }
        Resource = "${aws_s3_bucket.static_site.arn}/*"
      }
    ]
  })
}

resource "aws_s3_bucket_policy" "log_store_policy" {
  bucket = aws_s3_bucket.log_store.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Principal = {
          Service = "cloudfront.amazonaws.com"
        },
        Action = "s3:PutObject",
        Resource = "${aws_s3_bucket.log_store.arn}/*",
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = "arn:aws:cloudfront::${data.aws_caller_identity.current.account_id}:distribution/${aws_cloudfront_distribution.cdn.id}"
          }
        }
      }
    ]
  })
}

data aws_caller_identity "current" {}