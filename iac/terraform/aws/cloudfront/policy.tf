resource "aws_s3_bucket_policy" "bucket_access_policy" {
  bucket = var.static_site_bucket.id
  policy = data.aws_iam_policy_document.bucket_access_policy_document.json
}

resource "aws_s3_bucket_policy" "log_store_policy" {
  bucket = var.log_store_bucket.id
  policy = data.aws_iam_policy_document.log_store_policy_document.json
}

data "aws_iam_policy_document" "log_store_policy_document" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    actions = ["s3:PutObject"]

    resources = ["${var.log_store_bucket.arn}/*"]

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudformation_stack.cdn.outputs["CloudFrontArn"]]
    }
  }
}

data "aws_iam_policy_document" "bucket_access_policy_document" {
  statement {
    effect = "Allow"

    actions = ["s3:GetObject"]

    principals {
      type        = "AWS"
      identifiers = [aws_cloudfront_origin_access_identity.s3_static_bucket_oai.iam_arn]
    }

    resources = ["${var.static_site_bucket.arn}/*"]
  }
}
