locals {
  lambda_options = {
    register-user-device = {
      name                       = "register-user-device"
      handler                    = "registerUserDevice.default"
      zip_path                   = "registerUserDevice.zip"
      statement                  = concat(local.policies.common_policies, local.policies.dynamodb_query_policy, local.policies.sns_publish_policy)
      invocation_arn_placeholder = "REGISTER_USER_DEVICE_INVOCATION_ARN"
      env_variables = {
        PLATFORM_ARN_FCM    = aws_sns_platform_application.android_app.arn
        DYNAMODB_TABLE_NAME = split("/", var.dynamodb_table_arn)[1]
      }
    },
    send-push-notification = {
      name      = "send-push-notification"
      handler   = "sendPushNotification.default"
      zip_path  = "sendPushNotification.zip"
      statement = concat(local.policies.common_policies, local.policies.dynamodb_query_policy, local.policies.sns_publish_policy, local.policies.sqs_receive_policy)
      env_variables = {
        NOTIFICATION_TOPIC_ARN = aws_sns_platform_application.android_app.arn
        DYNAMODB_TABLE_NAME    = split("/", var.dynamodb_table_arn)[1]
      }
    }
  }
}
