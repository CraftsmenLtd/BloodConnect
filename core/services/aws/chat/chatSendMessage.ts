import { parseChannelId } from '../../../../commons/dto/ChatDTO'
import type { ChatMessageDTO } from '../../../../commons/dto/ChatDTO'
import { NotificationType } from '../../../../commons/dto/NotificationDTO'
import type { NotificationAttributes } from '../../../application/notificationWorkflow/Types'
import { ChatService } from '../../../application/chatWorkflow/ChatService'
import type { QueueModel } from '../../../application/models/queue/QueueModel'
import ApplicationError from '../../../../commons/libs/errors/ApplicationError'
import ChatDynamoDbOperations from '../commons/ddbOperations/ChatDynamoDbOperations'
import ChatRateLimitDynamoDbOperations from '../commons/ddbOperations/ChatRateLimitDynamoDbOperations'
import ChatConnectionDynamoDbOperations from '../commons/ddbOperations/ChatConnectionDynamoDbOperations'
import WebSocketOperations from '../commons/apiGateway/WebSocketOperations'
import SQSOperations from '../commons/sqs/SQSOperations'
import { Config } from '../../../../commons/libs/config/config'
import { createServiceLogger } from '../commons/logger/ServiceLogger'

const config = new Config<{
  dynamodbTableName: string;
  awsRegion: string;
  notificationQueueUrl: string;
}>().getConfig()

const chatDynamoDbOperations = new ChatDynamoDbOperations(
  config.dynamodbTableName,
  config.awsRegion
)
const chatRateLimitDynamoDbOperations = new ChatRateLimitDynamoDbOperations(
  config.dynamodbTableName,
  config.awsRegion
)
const chatConnectionDynamoDbOperations = new ChatConnectionDynamoDbOperations(
  config.dynamodbTableName,
  config.awsRegion
)

type SendMessageEvent = {
  requestContext: {
    connectionId: string;
    domainName: string;
    stage: string;
  };
  body?: string | null;
}

const parseBody = (body?: string | null): { channelId: string; content: string } | null => {
  if (body === undefined || body === null || body === '') {
    return null
  }
  try {
    const parsed = JSON.parse(body)
    if (
      typeof parsed.channelId === 'string'
      && typeof parsed.content === 'string'
      && parsed.content !== ''
    ) {
      return { channelId: parsed.channelId, content: parsed.content }
    }

    return null
  } catch {
    return null
  }
}

const enqueueChatPush = async(
  queueModel: QueueModel,
  recipientId: string,
  message: ChatMessageDTO
): Promise<void> => {
  const notification: NotificationAttributes = {
    userId: recipientId,
    title: 'New message',
    body: 'You have a new chat message.',
    type: NotificationType.CHAT_MESSAGE,
    payload: {
      channelId: message.channelId,
      senderId: message.senderId,
      messageId: message.messageId,
      createdAt: message.createdAt
    }
  }
  await queueModel.queue(notification, config.notificationQueueUrl)
}

// WebSocket sendMessage: resolves the sender from the connection store (the $connect authorizer
// context is not propagated to message routes), persists via ChatService (which enforces
// participant-only + not-locked + rate limit), fans the saved message out to both participants'
// live connections, prunes stale connections, and enqueues an offline push for a recipient with no
// live connection.
async function chatSendMessage(event: SendMessageEvent): Promise<{ statusCode: number }> {
  const { connectionId, domainName, stage } = event.requestContext
  const logger = createServiceLogger('chat-send-message', { connectionId })

  const senderConnection = await chatConnectionDynamoDbOperations.getByConnectionId(connectionId)
  if (senderConnection === null) {
    logger.error('no stored connection for sender')

    return { statusCode: 401 }
  }
  const senderId = senderConnection.userId

  const parsed = parseBody(event.body)
  if (parsed === null) {
    return { statusCode: 400 }
  }
  const { channelId, content } = parsed

  const chatService = new ChatService(
    chatDynamoDbOperations,
    chatRateLimitDynamoDbOperations,
    logger
  )

  let savedMessage: ChatMessageDTO
  try {
    savedMessage = await chatService.sendMessage(channelId, senderId, content)
  } catch (error) {
    logger.error({ error }, 'sendMessage rejected')

    return { statusCode: error instanceof ApplicationError ? error.errorCode : 500 }
  }

  const webSocketOperations = new WebSocketOperations(
    `https://${domainName}/${stage}`,
    config.awsRegion
  )
  const queueModel = new SQSOperations(config.awsRegion)
  const { seekerId, donorId } = parseChannelId(channelId)

  for (const participantId of [seekerId, donorId]) {
    const connections = await chatConnectionDynamoDbOperations.queryByUserId(participantId)

    if (connections.length === 0) {
      // Offline recipient (never the sender) gets a push fallback.
      if (participantId !== senderId) {
        await enqueueChatPush(queueModel, participantId, savedMessage)
      }
      continue
    }

    for (const connection of connections) {
      const { gone } = await webSocketOperations.postToConnection(
        connection.connectionId,
        savedMessage
      )
      if (gone) {
        await chatConnectionDynamoDbOperations.deleteByConnectionId(connection.connectionId)
      }
    }
  }

  return { statusCode: 200 }
}

export default chatSendMessage
