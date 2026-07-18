locals {
  table_name = split("/", var.dynamodb_table_arn)[1]

  lambda_options = {
    chat-connect = {
      name         = "chat-connect"
      handler      = "chatConnect.default"
      js_file_name = "chatConnect.js"
      statement = concat(
        local.policies.common_policies,
        local.policies.dynamodb_create_policy
      )
      env_variables = {
        DYNAMODB_TABLE_NAME = local.table_name
      }
    },
    chat-disconnect = {
      name         = "chat-disconnect"
      handler      = "chatDisconnect.default"
      js_file_name = "chatDisconnect.js"
      statement = concat(
        local.policies.common_policies,
        local.policies.dynamodb_update_policy
      )
      env_variables = {
        DYNAMODB_TABLE_NAME = local.table_name
      }
    },
    chat-send-message = {
      name         = "chat-send-message"
      handler      = "chatSendMessage.default"
      js_file_name = "chatSendMessage.js"
      statement = concat(
        local.policies.common_policies,
        local.policies.dynamodb_create_policy,
        local.policies.dynamodb_update_policy,
        local.policies.sqs_policy,
        local.policies.manage_connections_policy
      )
      env_variables = {
        DYNAMODB_TABLE_NAME    = local.table_name
        NOTIFICATION_QUEUE_URL = var.push_notification_queue.url
      }
    },
    chat-authorizer = {
      name         = "chat-authorizer"
      handler      = "chatConnectAuthorizer.default"
      js_file_name = "chatConnectAuthorizer.js"
      statement    = local.policies.common_policies
      env_variables = {
        COGNITO_USER_POOL_ID = var.cognito_user_pool_id
        COGNITO_CLIENT_ID    = var.cognito_app_client_id
      }
    },
    chat-channel-creator = {
      name         = "chat-channel-creator"
      handler      = "chatChannelCreator.default"
      js_file_name = "chatChannelCreator.js"
      statement = concat(
        local.policies.common_policies,
        local.policies.dynamodb_create_policy,
        local.policies.dynamodb_update_policy
      )
      env_variables = {
        DYNAMODB_TABLE_NAME = local.table_name
      }
    },
    chat-channel-locker = {
      name         = "chat-channel-locker"
      handler      = "chatChannelLocker.default"
      js_file_name = "chatChannelLocker.js"
      statement = concat(
        local.policies.common_policies,
        local.policies.dynamodb_update_policy
      )
      env_variables = {
        DYNAMODB_TABLE_NAME = local.table_name
      }
    },
    chat-list-channels = {
      name                       = "chat-list-channels"
      handler                    = "chatListChannels.default"
      js_file_name               = "chatListChannels.js"
      invocation_arn_placeholder = "CHAT_LIST_CHANNELS_INVOCATION_ARN"
      statement = concat(
        local.policies.common_policies,
        local.policies.dynamodb_create_policy
      )
      env_variables = {
        DYNAMODB_TABLE_NAME = local.table_name
      }
    },
    chat-get-history = {
      name                       = "chat-get-history"
      handler                    = "chatGetHistory.default"
      js_file_name               = "chatGetHistory.js"
      invocation_arn_placeholder = "CHAT_GET_HISTORY_INVOCATION_ARN"
      statement = concat(
        local.policies.common_policies,
        local.policies.dynamodb_create_policy
      )
      env_variables = {
        DYNAMODB_TABLE_NAME = local.table_name
      }
    },
    chat-mark-read = {
      name                       = "chat-mark-read"
      handler                    = "chatMarkRead.default"
      js_file_name               = "chatMarkRead.js"
      invocation_arn_placeholder = "CHAT_MARK_READ_INVOCATION_ARN"
      statement = concat(
        local.policies.common_policies,
        local.policies.dynamodb_update_policy
      )
      env_variables = {
        DYNAMODB_TABLE_NAME = local.table_name
      }
    }
  }
}
