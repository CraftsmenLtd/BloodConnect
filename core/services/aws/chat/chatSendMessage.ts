import { Config } from '../../../../commons/libs/config/config'
import { createServiceLogger } from '../commons/logger/ServiceLogger'
import ChatConnectionDynamoDbOperations from '../commons/ddbOperations/ChatConnectionDynamoDbOperations'
import ChatChannelDynamoDbOperations from '../commons/ddbOperations/ChatChannelDynamoDbOperations'
import ChatMessageDynamoDbOperations from '../commons/ddbOperations/ChatMessageDynamoDbOperations'
import ApiGatewayManagementApiOperations from '../commons/realtime/ApiGatewayManagementApiOperations'
import SQSOperations from '../commons/sqs/SQSOperations'
import { ChatConnectionService } from '../../../application/chatWorkflow/ChatConnectionService'
import { ChatChannelService } from '../../../application/chatWorkflow/ChatChannelService'
import { ChatMessageService } from '../../../application/chatWorkflow/ChatMessageService'
import { parseInboundFrame } from '../../../application/chatWorkflow/wsFrame'
import ChatPushNotifier from './ChatPushNotifier'
import type { ChatWsEvent } from './websocketTypes'
import { realtimeEndpoint, wsErrorResponse } from './websocketTypes'

const config = new Config<{
  dynamodbTableName: string;
  awsRegion: string;
  notificationQueueUrl: string;
}>().getConfig()

const chatConnectionDynamoDbOperations = new ChatConnectionDynamoDbOperations(
  config.dynamodbTableName,
  config.awsRegion
)
const chatChannelDynamoDbOperations = new ChatChannelDynamoDbOperations(
  config.dynamodbTableName,
  config.awsRegion
)
const chatMessageDynamoDbOperations = new ChatMessageDynamoDbOperations(
  config.dynamodbTableName,
  config.awsRegion
)

async function chatSendMessage(event: ChatWsEvent): Promise<{ statusCode: number }> {
  const logger = createServiceLogger('chatSendMessage')
  try {
    const { connectionId } = event.requestContext
    if (connectionId === undefined) {
      return { statusCode: 400 }
    }
    const connectionService = new ChatConnectionService(chatConnectionDynamoDbOperations, logger)
    const channelService = new ChatChannelService(chatChannelDynamoDbOperations, logger)
    const messageService = new ChatMessageService(chatMessageDynamoDbOperations, logger)

    const senderId = await connectionService.getConnectionUser(connectionId)
    const frame = parseInboundFrame(event.body)
    if (frame.action !== 'sendMessage') {
      return { statusCode: 400 }
    }

    const realtime = new ApiGatewayManagementApiOperations(
      realtimeEndpoint(event.requestContext),
      config.awsRegion
    )
    const offlineNotifier = new ChatPushNotifier(
      new SQSOperations(config.awsRegion),
      config.notificationQueueUrl
    )

    await messageService.sendMessage(
      {
        channelId: frame.channelId,
        senderId,
        body: frame.body,
        clientMessageId: frame.clientMessageId
      },
      channelService,
      connectionService,
      realtime,
      offlineNotifier
    )

    return { statusCode: 200 }
  } catch (error) {
    return wsErrorResponse(error, logger, 'chatSendMessage')
  }
}

export default chatSendMessage
