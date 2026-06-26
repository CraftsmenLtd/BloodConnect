import type { APIGatewayProxyWebsocketEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { ChatService } from '../../../application/chatWorkflow/ChatService'
import { ChatConnectionService } from '../../../application/chatWorkflow/ChatConnectionService'
import ChatChannelDynamoDbOperations from '../commons/ddbOperations/ChatChannelDynamoDbOperations'
import ChatMessageDynamoDbOperations from '../commons/ddbOperations/ChatMessageDynamoDbOperations'
import UserChannelDynamoDbOperations from '../commons/ddbOperations/UserChannelDynamoDbOperations'
import ChatConnectionDynamoDbOperations from '../commons/ddbOperations/ChatConnectionDynamoDbOperations'
import ChatRateLimitDynamoDbOperations from '../commons/ddbOperations/ChatRateLimitDynamoDbOperations'
import WebSocketClient from '../commons/websocket/WebSocketClient'
import SQSOperations from '../commons/sqs/SQSOperations'
import ChatOperationError from '../../../application/chatWorkflow/ChatOperationError'
import { Config } from '../../../../commons/libs/config/config'
import { createServiceLogger } from '../commons/logger/ServiceLogger'
import { GENERIC_CODES, HTTP_CODES } from '../../../../commons/libs/constants/GenericCodes'
import { THROTTLING_LIMITS } from '../../../../commons/libs/constants/ThrottlingLimits'
import { NotificationType } from '../../../../commons/dto/NotificationDTO'
import type { NotificationAttributes } from '../../../application/notificationWorkflow/Types'
import type { ChatMessageDTO } from '../../../../commons/dto/ChatDTO'

const config = new Config<{
  chatDynamodbTableName: string;
  awsRegion: string;
  notificationQueueUrl: string;
}>().getConfig()

const sqsOperations = new SQSOperations(config.awsRegion)

const chatChannelOperations = new ChatChannelDynamoDbOperations(
  config.chatDynamodbTableName,
  config.awsRegion
)
const chatMessageOperations = new ChatMessageDynamoDbOperations(
  config.chatDynamodbTableName,
  config.awsRegion
)
const userChannelOperations = new UserChannelDynamoDbOperations(
  config.chatDynamodbTableName,
  config.awsRegion
)
const chatConnectionOperations = new ChatConnectionDynamoDbOperations(
  config.chatDynamodbTableName,
  config.awsRegion
)
const rateLimitOperations = new ChatRateLimitDynamoDbOperations(
  config.chatDynamodbTableName,
  config.awsRegion
)

type WebsocketRequestContextWithAuthorizer =
  APIGatewayProxyWebsocketEventV2['requestContext'] & {
    authorizer?: { userId?: string };
  }

type SendMessageBody = {
  channelId?: string;
  content?: string;
}

async function sendMessage(
  event: APIGatewayProxyWebsocketEventV2
): Promise<APIGatewayProxyResultV2> {
  const requestContext = event.requestContext as WebsocketRequestContextWithAuthorizer
  const connectionId = requestContext.connectionId
  const userId = requestContext.authorizer?.userId ?? ''

  const logger = createServiceLogger(userId, { connectionId })
  const webSocketClient = new WebSocketClient(
    WebSocketClient.endpointFrom(requestContext.domainName, requestContext.stage),
    config.awsRegion
  )
  const chatConnectionService = new ChatConnectionService(chatConnectionOperations, logger)

  if (userId === '') {
    await webSocketClient.post(connectionId, { type: 'error', message: 'Unauthorized' })

    return { statusCode: HTTP_CODES.UNAUTHORIZED, body: 'Unauthorized' }
  }

  const body = parseBody(event.body)
  if (body.channelId === undefined || body.content === undefined) {
    await webSocketClient.post(connectionId, {
      type: 'error',
      message: 'channelId and content are required.'
    })

    return { statusCode: HTTP_CODES.BAD_REQUEST, body: 'Bad Request' }
  }

  const messageCount = await rateLimitOperations.incrementMessageCount(userId)
  if (messageCount > THROTTLING_LIMITS.CHAT_MESSAGE.MAX_MESSAGES_PER_MINUTE) {
    await webSocketClient.post(connectionId, {
      type: 'error',
      message: THROTTLING_LIMITS.CHAT_MESSAGE.ERROR_MESSAGE
    })

    return { statusCode: HTTP_CODES.TOO_MANY_REQUESTS, body: 'Too Many Requests' }
  }

  const chatService = new ChatService(
    chatChannelOperations,
    chatMessageOperations,
    userChannelOperations,
    logger
  )

  try {
    const { message, recipientId } = await chatService.sendMessage({
      channelId: body.channelId,
      senderId: userId,
      content: body.content
    })

    await deliver(
      webSocketClient,
      chatConnectionService,
      message,
      userId,
      recipientId,
      connectionId
    )

    return { statusCode: HTTP_CODES.OK, body: 'Sent' }
  } catch (error) {
    const statusCode
      = error instanceof ChatOperationError ? error.errorCode : GENERIC_CODES.ERROR
    const messageText
      = error instanceof ChatOperationError ? error.message : 'Failed to send message.'
    await webSocketClient.post(connectionId, { type: 'error', message: messageText })

    return { statusCode, body: messageText }
  }
}

function parseBody(rawBody: string | undefined): SendMessageBody {
  if (rawBody === undefined || rawBody === '') {
    return {}
  }
  try {
    return JSON.parse(rawBody) as SendMessageBody
  } catch {
    return {}
  }
}

async function deliver(
  webSocketClient: WebSocketClient,
  chatConnectionService: ChatConnectionService,
  message: ChatMessageDTO,
  senderId: string,
  recipientId: string,
  originConnectionId: string
): Promise<void> {
  const payload = { type: 'message', data: message }

  // Recipient: deliver over websocket, otherwise fall back to a push notification.
  const recipientDelivered = await postToUser(
    webSocketClient,
    chatConnectionService,
    recipientId,
    payload
  )
  if (!recipientDelivered) {
    await enqueuePushNotification(recipientId, message)
  }

  // Sender: echo to their other devices so multi-device sessions stay in sync.
  await postToUser(
    webSocketClient,
    chatConnectionService,
    senderId,
    payload,
    originConnectionId
  )
}

async function postToUser(
  webSocketClient: WebSocketClient,
  chatConnectionService: ChatConnectionService,
  userId: string,
  payload: unknown,
  excludeConnectionId?: string
): Promise<boolean> {
  const connections = (await chatConnectionService.getUserConnections(userId)).filter(
    (connection) => connection.connectionId !== excludeConnectionId
  )

  const results = await Promise.all(
    connections.map(async (connection) => {
      const delivered = await webSocketClient.post(connection.connectionId, payload)
      if (!delivered) {
        await chatConnectionService.removeConnection(connection.connectionId)
      }

      return delivered
    })
  )

  return results.some((delivered) => delivered)
}

async function enqueuePushNotification(
  recipientId: string,
  message: ChatMessageDTO
): Promise<void> {
  const notification: NotificationAttributes = {
    userId: recipientId,
    title: 'New message',
    body: message.content,
    type: NotificationType.CHAT_MESSAGE,
    payload: {
      channelId: message.channelId,
      senderId: message.senderId
    }
  }

  await sqsOperations.queue(notification, config.notificationQueueUrl)
}

export default sendMessage
