data "aws_iam_policy_document" "log_store_policy_document" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    actions = ["s3:PutObject"]

    resources = ["${aws_s3_bucket.log_store.arn}/*"]

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.cdn.arn]
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

    resources = ["${aws_s3_bucket.static_site.arn}/*"]
  }
}