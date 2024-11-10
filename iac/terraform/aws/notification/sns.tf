resource "aws_sns_platform_application" "android_app" {
  name                = "${var.environment}-android-platform-application"
  platform            = "GCM"
  platform_credential = var.firebase_token_s3_url
}