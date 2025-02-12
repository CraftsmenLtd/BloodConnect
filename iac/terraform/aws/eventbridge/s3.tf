resource "aws_s3_bucket" "monitor_donation_request" {
  #checkov:skip=CKV2_AWS_61: "Ensure that an S3 bucket has a lifecycle configuration"
  #checkov:skip=CKV2_AWS_62: "Ensure S3 buckets should have event notifications enabled"
  #checkov:skip=CKV_AWS_144: "Ensure that S3 bucket has cross-region replication enabled"
  #checkov:skip=CKV_AWS_145: "Ensure that S3 buckets are encrypted with KMS by default"
  #checkov:skip=CKV_AWS_18: "Ensure the S3 bucket has access logging enabled"
  #checkov:skip=CKV_AWS_21: "Ensure all data stored in the S3 bucket have versioning enabled"
  #checkov:skip=CKV2_AWS_6: "Ensure that S3 bucket has a Public Access block"
  bucket        = "${var.environment}-monitor-donation-request-bucket"
  force_destroy = true
}

resource "aws_s3_bucket_policy" "monitor_donation_request" {
  bucket = aws_s3_bucket.monitor_donation_request.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "PublicReadGetObject"
        Effect = "Allow"
        #checkov:skip=CKV_AWS_70: "Ensure S3 bucket does not allow an action with any Principal"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.monitor_donation_request.arn}/*"
      }
    ]
  })
}

resource "aws_s3_bucket_public_access_block" "monitor_donation_public_access_block" {
  bucket = aws_s3_bucket.monitor_donation_request.id

  #checkov:skip=CKV_AWS_54: "Ensure S3 bucket has block public policy enabled"
  #checkov:skip=CKV_AWS_53: "Ensure S3 bucket has block public ACLS enabled"
  #checkov:skip=CKV_AWS_55: "Ensure S3 bucket has ignore public ACLs enabled"
  #checkov:skip=CKV_AWS_56: "Ensure S3 bucket has 'restrict_public_bucket' enabled"
  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}
