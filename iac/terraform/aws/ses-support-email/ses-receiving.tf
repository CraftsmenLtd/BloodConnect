resource "aws_route53_record" "ses_mx" {
  zone_id = data.aws_route53_zone.selected.zone_id
  name    = var.domain_name
  type    = "MX"
  ttl     = 600
  records = ["10 inbound-smtp.${data.aws_region.current.name}.amazonaws.com"]
}

resource "aws_ses_receipt_rule_set" "main" {
  rule_set_name = "${var.domain_name}-receipt-rules"
}

resource "aws_ses_active_receipt_rule_set" "main" {
  rule_set_name = aws_ses_receipt_rule_set.main.rule_set_name
}

resource "aws_s3_bucket" "ses_email_store" {
  #checkov:skip=CKV_AWS_144: "Ensure that S3 bucket has cross-region replication enabled"
  #checkov:skip=CKV2_AWS_62: "Ensure S3 buckets should have event notifications enabled"
  #checkov:skip=CKV_AWS_21: "Ensure all data stored in the S3 bucket have versioning enabled"
  #checkov:skip=CKV_AWS_145: "Ensure that S3 buckets are encrypted with KMS by default"
  #checkov:skip=CKV_AWS_18: "Ensure the S3 bucket has access logging enabled"
  bucket = "${replace(var.domain_name, ".", "-")}-inbound-emails"
}

resource "aws_s3_bucket_lifecycle_configuration" "ses_email_store" {
  bucket = aws_s3_bucket.ses_email_store.id

  rule {
    id     = "expire-old-emails"
    status = "Enabled"

    filter {}

    expiration {
      days = 2555 # 7 years retention per SOP Section 5
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

resource "aws_s3_bucket_public_access_block" "ses_email_store" {
  bucket                  = aws_s3_bucket.ses_email_store.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "ses_email_store" {
  bucket = aws_s3_bucket.ses_email_store.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowSESPuts"
        Effect = "Allow"
        Principal = {
          Service = "ses.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.ses_email_store.arn}/*"
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })
}

resource "aws_sns_topic" "support_email_notify" {
  #checkov:skip=CKV_AWS_26: "Ensure all data stored in the SNS topic is encrypted"
  name = "${replace(var.domain_name, ".", "-")}-support-email-notify"
}

resource "aws_sns_topic_subscription" "poc_emails" {
  for_each  = toset(compact(split(",", var.poc_emails)))
  topic_arn = aws_sns_topic.support_email_notify.arn
  protocol  = "email"
  endpoint  = each.value
}

resource "aws_ses_receipt_rule" "support" {
  name          = "support-alias"
  rule_set_name = aws_ses_receipt_rule_set.main.rule_set_name
  recipients    = ["support@${var.domain_name}"]
  enabled       = true
  scan_enabled  = true

  s3_action {
    bucket_name       = aws_s3_bucket.ses_email_store.bucket
    object_key_prefix = "support/"
    position          = 1
  }

  sns_action {
    topic_arn = aws_sns_topic.support_email_notify.arn
    position  = 2
  }

  depends_on = [aws_s3_bucket_policy.ses_email_store]
}
