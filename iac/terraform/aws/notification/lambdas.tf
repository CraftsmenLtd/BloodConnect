locals {
  lambda_options = {
    send-notification = {
      name                       = "send-push-notification"
      handler                    = "sendPushNotification.default"
      zip_path                   = "sendPushNotification.zip"
      statement                  = concat(local.policies.common_policies, local.policies.dynamodb_query_policy, local.policies.sqs_send_policy)
      invocation_arn_placeholder = "SEND_PUSH_NOTIFICATION_INVOCATION_ARN"
      env_variables = {
        NOTIFICATION_QUEUE_URL = aws_sqs_queue.push_notification_queue.url
        DYNAMODB_TABLE_NAME    = split("/", var.dynamodb_table_arn)[1]
      }
    },
    process-notification = {
      name      = "process-push-notification"
      handler   = "processPushNotification.handler"
      zip_path  = "processPushNotification.zip"
      statement = concat(local.policies.common_policies, local.policies.sns_publish_policy)
      env_variables = {
        NOTIFICATION_TOPIC_ARN = aws_sns_topic.push_notification.arn
      }
    }
  }
}
