# Chat Lambda definitions. Mirrors the per-service module pattern (see ./../donation):
# a lambda_options map fanned out through the shared ./../lambda module, plus a
# lambda_metadata output for REST-side wiring in the root module.
#
# NOTE (skeleton): handler code lands in later tasks (connect/disconnect/authorizer in
# TASK-007, sendChatMessage in TASK-008, getChannelHistory in TASK-009). `terraform plan`
# only succeeds once those .ts handlers are built into core/services/aws/.build via
# `make build-node-all`, because the shared lambda module archives the built .js artifact.

variable "environment" {
  type        = string
  description = "Deployment environment"
}

variable "dynamodb_table_arn" {
  type        = string
  description = "ARN of the shared single-table DynamoDB table"
}

variable "push_notification_queue" {
  description = "Push-notification SQS queue (from the notification module) for offline CHAT_MESSAGE delivery"
}

variable "cognito_user_pool_id" {
  type        = string
  description = "Cognito user pool id used by the WS request authorizer to verify the JWT"
}

variable "cognito_user_pool_client_id" {
  type        = string
  description = "Cognito app client id used by the WS request authorizer to verify the JWT audience"
}

locals {
  chat_table_name = split("/", var.dynamodb_table_arn)[1]

  lambda_options = {
    connect = {
      name         = "chat-connect"
      handler      = "connectChatSession.default"
      js_file_name = "connectChatSession.js"
      statement    = concat(local.chat_policies.logs, local.chat_policies.connection_write)
      env_variables = {
        DYNAMODB_TABLE_NAME = local.chat_table_name
      }
    }

    disconnect = {
      name         = "chat-disconnect"
      handler      = "disconnectChatSession.default"
      js_file_name = "disconnectChatSession.js"
      statement    = concat(local.chat_policies.logs, local.chat_policies.connection_delete)
      env_variables = {
        DYNAMODB_TABLE_NAME = local.chat_table_name
      }
    }

    sendmessage = {
      name         = "chat-send-message"
      handler      = "sendChatMessage.default"
      js_file_name = "sendChatMessage.js"
      statement = concat(
        local.chat_policies.logs,
        local.chat_policies.message_write,
        local.chat_policies.manage_connections,
        local.chat_policies.push_notification
      )
      env_variables = {
        DYNAMODB_TABLE_NAME    = local.chat_table_name
        NOTIFICATION_QUEUE_URL = var.push_notification_queue.url
        WEBSOCKET_CALLBACK_URL = replace(aws_apigatewayv2_stage.chat_websocket.invoke_url, "wss://", "https://")
      }
    }

    authorizer = {
      name         = "chat-authorizer"
      handler      = "authorizeChatSession.default"
      js_file_name = "authorizeChatSession.js"
      statement    = local.chat_policies.logs
      env_variables = {
        USER_POOL_ID        = var.cognito_user_pool_id
        USER_POOL_CLIENT_ID = var.cognito_user_pool_client_id
      }
    }

    history = {
      name                       = "chat-get-channel-history"
      handler                    = "getChannelHistory.default"
      js_file_name               = "getChannelHistory.js"
      statement                  = concat(local.chat_policies.logs, local.chat_policies.history_read)
      invocation_arn_placeholder = "GET_CHANNEL_HISTORY_INVOCATION_ARN"
      env_variables = {
        DYNAMODB_TABLE_NAME = local.chat_table_name
      }
    }

    read = {
      name                       = "chat-mark-channel-read"
      handler                    = "markChannelRead.default"
      js_file_name               = "markChannelRead.js"
      statement                  = concat(local.chat_policies.logs, local.chat_policies.unread_reset)
      invocation_arn_placeholder = "MARK_CHANNEL_READ_INVOCATION_ARN"
      env_variables = {
        DYNAMODB_TABLE_NAME = local.chat_table_name
      }
    }
  }
}

module "lambda" {
  for_each      = local.lambda_options
  source        = "./../lambda"
  environment   = var.environment
  lambda_option = each.value
}

# Only REST handlers (those carrying an invocation_arn_placeholder) flow to the root
# lambda metadata map for REST API integration + invoke permission. The WebSocket
# handlers are wired entirely within this module (see websocket-api.tf).
output "lambda_metadata" {
  description = "Metadata for chat REST lambdas consumed by the root module"
  value = [
    for key, option in local.lambda_options : {
      lambda_function_name       = module.lambda[key].lambda_function_name
      lambda_invoke_arn          = module.lambda[key].lambda_invoke_arn
      invocation_arn_placeholder = try(option.invocation_arn_placeholder, null)
    } if try(option.invocation_arn_placeholder, null) != null
  ]
}
