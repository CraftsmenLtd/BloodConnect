locals {
  firebase_bucket = regex("^s3://([^/]+)/", var.firebase_token_s3_url)[0]
  firebase_key    = regex("^s3://[^/]+/(.+)$", var.firebase_token_s3_url)[0]
}

data "aws_s3_object" "firebase_token" {
  bucket = local.firebase_bucket
  key    = local.firebase_key
}

resource "aws_sns_platform_application" "android_app" {
  name                = "${var.environment}-android-platform-application"
  platform            = "GCM"
  platform_credential = data.aws_s3_object.firebase_token.body
}