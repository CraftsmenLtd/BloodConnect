locals {
  lambda_options = {
    create-chat-channel = {
      name         = "create-chat-channel"
      handler      = "createChatChannel.default"
      js_file_name = "createChatChannel.js"
      statement = concat(
        local.policies.common_policies,
        local.policies.chat_create_policy
      )
      invocation_arn_placeholder = ""
      env_variables = {
        CHAT_DYNAMODB_TABLE_NAME = split("/", var.dynamodb_chat_table_arn)[1]
      }
    },
    lock-chat-channel = {
      name         = "lock-chat-channel"
      handler      = "lockChatChannel.default"
      js_file_name = "lockChatChannel.js"
      statement = concat(
        local.policies.common_policies,
        local.policies.chat_update_policy
      )
      invocation_arn_placeholder = ""
      env_variables = {
        CHAT_DYNAMODB_TABLE_NAME = split("/", var.dynamodb_chat_table_arn)[1]
      }
    },
    chat-authorizer = {
      name         = "chat-authorizer"
      handler      = "chatAuthorizer.default"
      js_file_name = "chatAuthorizer.js"
      statement = concat(
        local.policies.common_policies,
        local.policies.cognito_get_user_policy
      )
      invocation_arn_placeholder = ""
      env_variables             = {}
    },
    chat-connect = {
      name         = "chat-connect"
      handler      = "chatConnect.default"
      js_file_name = "chatConnect.js"
      statement = concat(
        local.policies.common_policies,
        local.policies.chat_connection_policy
      )
      invocation_arn_placeholder = ""
      env_variables = {
        CHAT_DYNAMODB_TABLE_NAME = split("/", var.dynamodb_chat_table_arn)[1]
      }
    },
    chat-disconnect = {
      name         = "chat-disconnect"
      handler      = "chatDisconnect.default"
      js_file_name = "chatDisconnect.js"
      statement = concat(
        local.policies.common_policies,
        local.policies.chat_connection_policy
      )
      invocation_arn_placeholder = ""
      env_variables = {
        CHAT_DYNAMODB_TABLE_NAME = split("/", var.dynamodb_chat_table_arn)[1]
      }
    },
    chat-send-message = {
      name         = "chat-send-message"
      handler      = "chatSendMessage.default"
      js_file_name = "chatSendMessage.js"
      statement = concat(
        local.policies.common_policies,
        local.policies.chat_create_policy,
        local.policies.chat_update_policy,
        local.policies.chat_connection_policy,
        local.policies.websocket_manage_policy
      )
      invocation_arn_placeholder = ""
      env_variables = {
        CHAT_DYNAMODB_TABLE_NAME = split("/", var.dynamodb_chat_table_arn)[1]
      }
    }
  }
}
