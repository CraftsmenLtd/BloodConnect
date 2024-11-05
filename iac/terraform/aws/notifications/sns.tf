resource "aws_sns_platform_application" "android_app" {
  name                   = "AndroidPlatformApplication"
  platform               = "GCM"
  platform_principal     = "" # Not needed for FCM
  platform_credential    = var.firebase_server_key
}