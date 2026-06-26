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
    }
  }
}
