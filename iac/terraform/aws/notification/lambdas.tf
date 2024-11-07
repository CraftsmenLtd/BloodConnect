locals {
  lambda_options = {
    push-notification-mapper = {
      name                       = "push-notification-mapper"
      handler                    = "pushNotificationMapper.default"
      zip_path                   = "pushNotificationMapper.zip"
      statement                  = concat(local.policies.common_policies, local.policies.dynamodb_query_policy, local.policies.sqs_send_policy)
      invocation_arn_placeholder = "PUSH_NOTIFICATION_MAPPER_INVOCATION_ARN"
      env_variables = {
        NOTIFICATION_QUEUE_URL = aws_sqs_queue.push_notification_queue.url
        DYNAMODB_TABLE_NAME    = split("/", var.dynamodb_table_arn)[1]
      }
    },
    send-push-notification = {
      name      = "send-push-notification"
      handler   = "sendPushNotification.handler"
      zip_path  = "sendPushNotification.zip"
      statement = concat(local.policies.common_policies, local.policies.sns_publish_policy, local.policies.sqs_receive_policy)
      env_variables = {
        NOTIFICATION_TOPIC_ARN = aws_sns_topic.push_notification.arn
      }
    }
  }
}
