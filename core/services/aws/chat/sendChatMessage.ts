import type { APIGatewayProxyResult } from 'aws-lambda'
import { GoneException } from '@aws-sdk/client-apigatewaymanagementapi'
import type { ChatMessageDTO } from '../../../../commons/dto/ChatDTO'
import { HTTP_CODES } from '../../../../commons/libs/constants/GenericCodes'
import { UNKNOWN_ERROR_MESSAGE } from '../../../../commons/libs/constants/ApiResponseMessages'
import { NotificationType } from '../../../../commons/dto/NotificationDTO'
import type { NotificationAttributes } from '../../../application/notificationWorkflow/Types'
import ApplicationError from '../../../../commons/libs/errors/ApplicationError'
import { Config } from '../../../../commons/libs/config/config'
import generateApiGatewayResponse from '../commons/lambda/ApiGateway'
import { ChatMessageService } from '../../../application/chatWorkflow/ChatMessageService'
import { getRecipient } from '../../../application/chatWorkflow/participants'
import ChatMessageDynamoDbOperations from '../commons/ddbOperations/ChatMessageDynamoDbOperations'
import ChatChannelDynamoDbOperations from '../commons/ddbOperations/ChatChannelDynamoDbOperations'
import WsConnectionDynamoDbOperations from '../commons/ddbOperations/WsConnectionDynamoDbOperations'
import ManagementApiOperations from '../commons/apiGateway/ManagementApiOperations'
import SQSOperations from '../commons/sqs/SQSOperations'
import type { WsConnectionDTO } from '../commons/ddbModels/WsConnectionModel'

// WebSocket `sendmessage` route. The senderId is taken only from the $connect
// authorizer context (the verified Cognito sub) — never from the client body — and
// the channel participant/lock/rate-limit/dedupe rules live in ChatMessageService.
// On success the message is delivered real-time to every live recipient connection;
// when the recipient has no live connection (none, or all returned 410/Gone) exactly
// one CHAT_MESSAGE push is enqueued onto the existing SQS->SNS path (no double-notify).
const config = new Config<{
  dynamodbTableName: string;
  awsRegion: string;
  notificationQueueUrl: string;
}>().getConfig()

const chatMessageDynamoDbOperations = new ChatMessageDynamoDbOperations(
  config.dynamodbTableName,
  config.awsRegion
)
const chatChannelDynamoDbOperations = new ChatChannelDynamoDbOperations(
  config.dynamodbTableName,
  config.awsRegion
)
const wsConnectionDynamoDbOperations = new WsConnectionDynamoDbOperations(
  config.dynamodbTableName,
  config.awsRegion
)

type ChatSendEvent = {
  requestContext: {
    connectionId: string;
    domainName?: string;
    stage?: string;
    authorizer?: { userId?: string } | null;
  };
  body?: string | null;
}

type SendMessagePayload = {
  channelId: string;
  text: string;
  messageId: string;
  clientCreatedAt: string;
}

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value !== ''

const toPayload = (parsed: unknown): SendMessagePayload | undefined => {
  if (typeof parsed !== 'object' || parsed === null) {
    return undefined
  }
  const { channelId, text, messageId, clientCreatedAt } = parsed as Record<string, unknown>
  if (![channelId, text, messageId, clientCreatedAt].every(isNonEmptyString)) {
    return undefined
  }

  return {
    channelId: channelId as string,
    text: text as string,
    messageId: messageId as string,
    clientCreatedAt: clientCreatedAt as string
  }
}

const parsePayload = (body?: string | null): SendMessagePayload | undefined => {
  if (body === undefined || body === null || body.trim() === '') {
    return undefined
  }
  try {
    return toPayload(JSON.parse(body))
  } catch {
    return undefined
  }
}

const resolveStatusCode = (error: unknown): number =>
  error instanceof ApplicationError ? error.errorCode : HTTP_CODES.ERROR

const buildFrame = (message: ChatMessageDTO): Record<string, unknown> => ({
  type: NotificationType.CHAT_MESSAGE,
  channelId: message.channelId,
  messageId: message.messageId,
  senderId: message.senderId,
  text: message.text,
  createdAt: message.createdAt
})

const isGone = (error: unknown): boolean =>
  error instanceof GoneException
  || (error instanceof Error && error.name === 'GoneException')

const buildManagementApi = (event: ChatSendEvent): ManagementApiOperations =>
  new ManagementApiOperations(
    `https://${event.requestContext.domainName}/${event.requestContext.stage}`,
    config.awsRegion
  )

// Pushes the frame to one connection; a 410/Gone means the connection is stale, so
// it is deleted and reported as not-delivered (the caller falls through to push).
const postOne = async (
  managementApi: ManagementApiOperations,
  recipientId: string,
  connection: WsConnectionDTO,
  message: ChatMessageDTO
): Promise<boolean> => {
  try {
    await managementApi.postToConnection(connection.connectionId, buildFrame(message))

    return true
  } catch (error) {
    if (isGone(error)) {
      await wsConnectionDynamoDbOperations.deleteConnection(recipientId, connection.connectionId)

      return false
    }
    throw error
  }
}

const deliverToConnections = async (
  event: ChatSendEvent,
  recipientId: string,
  connections: WsConnectionDTO[],
  message: ChatMessageDTO
): Promise<boolean> => {
  if (connections.length === 0) {
    return false
  }
  const managementApi = buildManagementApi(event)
  const results = await Promise.all(
    connections.map((connection) => postOne(managementApi, recipientId, connection, message))
  )

  return results.some((delivered) => delivered)
}

const pushOffline = async (recipientId: string, message: ChatMessageDTO): Promise<void> => {
  const notification: NotificationAttributes = {
    userId: recipientId,
    title: 'New message',
    body: message.text,
    type: NotificationType.CHAT_MESSAGE,
    payload: {
      channelId: message.channelId,
      messageId: message.messageId,
      senderId: message.senderId
    }
  }
  await new SQSOperations(config.awsRegion).queue(notification, config.notificationQueueUrl)
}

// Real-time fan-out with a single offline fallback: push only when no live
// connection accepted the frame (none stored, or every one returned 410).
const deliverOrPush = async (event: ChatSendEvent, message: ChatMessageDTO): Promise<void> => {
  const recipientId = getRecipient(message.channelId, message.senderId)
  const connections = await wsConnectionDynamoDbOperations.getConnectionsForUser(recipientId)
  const delivered = await deliverToConnections(event, recipientId, connections, message)
  if (!delivered) {
    await pushOffline(recipientId, message)
  }
}

const sendChatMessage = async (event: ChatSendEvent): Promise<APIGatewayProxyResult> => {
  const senderId = event.requestContext.authorizer?.userId
  if (senderId === undefined || senderId === '') {
    return generateApiGatewayResponse({ message: 'Unauthorized' }, HTTP_CODES.UNAUTHORIZED)
  }
  const payload = parsePayload(event.body)
  if (payload === undefined) {
    return generateApiGatewayResponse({ message: 'Invalid message payload' }, HTTP_CODES.BAD_REQUEST)
  }
  const chatMessageService = new ChatMessageService(
    chatMessageDynamoDbOperations,
    chatChannelDynamoDbOperations
  )
  try {
    const message = await chatMessageService.sendMessage(
      payload.channelId, senderId, payload.text, payload.clientCreatedAt, payload.messageId
    )
    await deliverOrPush(event, message)

    return generateApiGatewayResponse({ message: 'Sent' }, HTTP_CODES.OK)
  } catch (error) {
    const message = error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE

    return generateApiGatewayResponse({ message }, resolveStatusCode(error))
  }
}

export default sendChatMessage
