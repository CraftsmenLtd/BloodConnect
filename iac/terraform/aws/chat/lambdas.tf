locals {
  lambda_options = {
    chat-authorizer = {
      name         = "chat-authorizer"
      handler      = "chatAuthorizer.default"
      js_file_name = "chatAuthorizer.js"
      statement    = local.policies.common
      env_variables = {
        COGNITO_USER_POOL_ID = var.cognito_user_pool_id
        COGNITO_CLIENT_ID    = var.cognito_client_id
      }
    }
    chat-connect = {
      name          = "chat-connect"
      handler       = "chatConnect.default"
      js_file_name  = "chatConnect.js"
      statement     = concat(local.policies.common, local.policies.table_rw)
      env_variables = { DYNAMODB_TABLE_NAME = local.dynamodb_table_name }
    }
    chat-disconnect = {
      name          = "chat-disconnect"
      handler       = "chatDisconnect.default"
      js_file_name  = "chatDisconnect.js"
      statement     = concat(local.policies.common, local.policies.table_rw)
      env_variables = { DYNAMODB_TABLE_NAME = local.dynamodb_table_name }
    }
    chat-send-message = {
      name         = "chat-send-message"
      handler      = "chatSendMessage.default"
      js_file_name = "chatSendMessage.js"
      statement = concat(
        local.policies.common,
        local.policies.table_rw,
        local.policies.manage_connections,
        local.policies.sqs_send
      )
      env_variables = {
        DYNAMODB_TABLE_NAME    = local.dynamodb_table_name
        NOTIFICATION_QUEUE_URL = var.notification_queue_url
      }
    }
    chat-typing = {
      name         = "chat-typing"
      handler      = "chatTyping.default"
      js_file_name = "chatTyping.js"
      statement    = concat(local.policies.common, local.policies.table_read, local.policies.manage_connections)
      env_variables = { DYNAMODB_TABLE_NAME = local.dynamodb_table_name }
    }
    chat-mark-read = {
      name         = "chat-mark-read"
      handler      = "chatMarkRead.default"
      js_file_name = "chatMarkRead.js"
      statement    = concat(local.policies.common, local.policies.table_rw, local.policies.manage_connections)
      env_variables = { DYNAMODB_TABLE_NAME = local.dynamodb_table_name }
    }
    chat-channel-creator = {
      name          = "chat-channel-creator"
      handler       = "chatChannelCreator.default"
      js_file_name  = "chatChannelCreator.js"
      statement     = concat(local.policies.common, local.policies.table_rw, local.policies.stream_read)
      env_variables = { DYNAMODB_TABLE_NAME = local.dynamodb_table_name }
    }
    chat-get-history = {
      name                       = "chat-get-history"
      handler                    = "chatGetHistory.default"
      js_file_name               = "chatGetHistory.js"
      statement                  = concat(local.policies.common, local.policies.table_read)
      invocation_arn_placeholder = "CHAT_GET_HISTORY_INVOCATION_ARN"
      env_variables              = { DYNAMODB_TABLE_NAME = local.dynamodb_table_name }
    }
    chat-list-channels = {
      name                       = "chat-list-channels"
      handler                    = "chatListChannels.default"
      js_file_name               = "chatListChannels.js"
      statement                  = concat(local.policies.common, local.policies.table_read)
      invocation_arn_placeholder = "CHAT_LIST_CHANNELS_INVOCATION_ARN"
      env_variables              = { DYNAMODB_TABLE_NAME = local.dynamodb_table_name }
    }
  }
}
