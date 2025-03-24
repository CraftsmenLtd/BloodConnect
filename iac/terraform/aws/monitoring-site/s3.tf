resource "aws_s3_bucket" "monitoring_site" {
  #checkov:skip=CKV2_AWS_61: "Ensure that an S3 bucket has a lifecycle configuration"
  #checkov:skip=CKV2_AWS_62: "Ensure S3 buckets should have event notifications enabled"
  #checkov:skip=CKV_AWS_144: "Ensure that S3 bucket has cross-region replication enabled"
  #checkov:skip=CKV_AWS_145: "Ensure that S3 buckets are encrypted with KMS by default"
  #checkov:skip=CKV_AWS_18: "Ensure the S3 bucket has access logging enabled"
  #checkov:skip=CKV_AWS_21: "Ensure all data stored in the S3 bucket have versioning enabled"
  bucket        = "${var.environment}-monitoring-site"
  force_destroy = true
  tags = {
    Name = "MonitoringSiteBucket"
  }
}

resource "aws_s3_bucket_cors_configuration" "monitoring_site" {
  bucket = aws_s3_bucket.monitoring_site.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
  }
}

resource "aws_s3_bucket_public_access_block" "monitoring_site_public_access_block" {
  bucket = aws_s3_bucket.monitoring_site.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

locals {
  client_path = "${path.module}/../../../../clients/monitoring"
  dist_path   = "${local.client_path}/dist"

  content_type_map = {
    "js"   = "application/javascript"
    "html" = "text/html"
    "css"  = "text/css"
  }
}

resource "null_resource" "vite_build" {
  triggers = {
    directory_md5 = timestamp()
  }

  provisioner "local-exec" {
    command     = "npm run build"
    working_dir = local.client_path

    environment = {
      VITE_AWS_S3_BUCKET           = aws_s3_bucket.monitoring_site.id
      VITE_BUCKET_PATH_PREFIX      = local.monitor_donation_request_s3_path_prefix
      VITE_AWS_S3_REGION           = aws_s3_bucket.monitoring_site.region
      VITE_MAPBOX_PUBLIC_KEY       = var.mapbox_public_key
      VITE_BASE_ROUTE              = var.site_path
      VITE_AWS_USER_POOL_ID        = var.cognito_user_pool_id
      VITE_AWS_USER_POOL_CLIENT_ID = var.cognito_app_client_id
      VITE_AWS_IDENTITY_POOL_ID    = var.cognito_identity_pool_id
      VITE_MAX_GEOHASH_PREFIX_SIZE = var.max_geohash_prefix_length
    }
  }
}

resource "aws_s3_object" "site_assets" {
  depends_on    = [null_resource.vite_build]
  for_each      = fileset(local.dist_path, "**/*")
  force_destroy = true
  bucket        = aws_s3_bucket.monitoring_site.id
  key           = "${var.site_path}/${each.key}"
  source        = "${local.dist_path}/${each.value}"
  source_hash   = filemd5("${local.dist_path}/${each.value}")
  etag          = filemd5("${local.dist_path}/${each.value}")
  content_type  = lookup(local.content_type_map, split(".", each.value)[1], "text/html")
}

resource "aws_iam_policy" "data_access_policy" {
  name        = "${var.environment}-maintainers-policy"
  description = "Policy to restrict S3 access by Cognito user group"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.monitoring_site.arn}/${local.monitor_donation_request_s3_path_prefix}/*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "maintainers_role_attachment" {
  role       = var.maintainers_role
  policy_arn = aws_iam_policy.data_access_policy.arn
}
