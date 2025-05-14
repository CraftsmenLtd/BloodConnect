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
  dist_dir    = "dist"
  client_path = "${path.module}/../../../../clients/monitoring"
  dist_path   = "${local.client_path}/${local.dist_dir}"

  content_type_map = {
    "js"   = "application/javascript"
    "html" = "text/html"
    "css"  = "text/css"
  }
}

data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

resource "null_resource" "vite_build" {
  triggers = {
    directory_sha1 = sha1(join("", [
      for f in fileset(local.client_path, "**/*") :
      filesha1("${local.client_path}/${f}") if !strcontains(f, "node_modules")
    ]))

    VITE_AWS_REGION              = data.aws_region.current.name
    VITE_BASE_ROUTE              = var.site_path
    VITE_AWS_USER_POOL_ID        = var.cognito_user_pool_id
    VITE_AWS_USER_POOL_CLIENT_ID = var.cognito_app_client_id
    VITE_AWS_IDENTITY_POOL_ID    = var.cognito_identity_pool_id
    VITE_MAX_GEOHASH_PREFIX_SIZE = var.max_geohash_prefix_length
    VITE_AWS_COGNITO_DOMAIN      = var.cognito_custom_domain_name
    VITE_AWS_REDIRECT_SIGN_IN    = "https://${var.bloodconnect_domain}/${var.site_path}/index.html"
    VITE_AWS_REDIRECT_SIGN_OUT   = "https://${var.bloodconnect_domain}/${var.site_path}/index.html"
  }
  provisioner "local-exec" {
    on_failure  = fail
    command     = "npm run build"
    working_dir = local.client_path

    environment = {
      VITE_AWS_REGION              = data.aws_region.current.name
      VITE_AWS_DYNAMODB_TABLE      = var.dynamodb_table_name
      VITE_BASE_ROUTE              = var.site_path
      VITE_AWS_USER_POOL_ID        = var.cognito_user_pool_id
      VITE_AWS_USER_POOL_CLIENT_ID = var.cognito_app_client_id
      VITE_AWS_IDENTITY_POOL_ID    = var.cognito_identity_pool_id
      VITE_MAX_GEOHASH_PREFIX_SIZE = var.max_geohash_prefix_length
      VITE_AWS_COGNITO_DOMAIN      = var.cognito_custom_domain_name
      VITE_AWS_REDIRECT_SIGN_IN    = "https://${var.bloodconnect_domain}/${var.site_path}/index.html"
      VITE_AWS_REDIRECT_SIGN_OUT   = "https://${var.bloodconnect_domain}/${var.site_path}/index.html"
    }
  }

  provisioner "local-exec" {
    command     = "${var.environment == "localstack" ? "awslocal" : "aws"} s3 cp ${local.dist_dir} s3://${aws_s3_bucket.monitoring_site.id}/${var.site_path}/ --recursive --region ${aws_s3_bucket.monitoring_site.region}"
    working_dir = local.client_path
  }
}

resource "aws_iam_policy" "data_access_policy" {
  name        = "${var.environment}-maintainers-policy"
  description = "Policy to restrict S3 access by Cognito user group"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:BatchGetItem",
          "dynamodb:DescribeTable",
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          "arn:aws:dynamodb:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:table/${var.dynamodb_table_name}",
          "arn:aws:dynamodb:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:table/${var.dynamodb_table_name}/index/*",
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "maintainers_role_attachment" {
  role       = var.maintainers_role
  policy_arn = aws_iam_policy.data_access_policy.arn
}
