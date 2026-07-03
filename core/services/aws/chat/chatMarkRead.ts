import { Config } from '../../../../commons/libs/config/config'
import { createServiceLogger } from '../commons/logger/ServiceLogger'
import ChatConnectionDynamoDbOperations from '../commons/ddbOperations/ChatConnectionDynamoDbOperations'
import ChatChannelDynamoDbOperations from '../commons/ddbOperations/ChatChannelDynamoDbOperations'
import ChatMessageDynamoDbOperations from '../commons/ddbOperations/ChatMessageDynamoDbOperations'
import ApiGatewayManagementApiOperations from '../commons/realtime/ApiGatewayManagementApiOperations'
import { ChatConnectionService } from '../../../application/chatWorkflow/ChatConnectionService'
import { ChatChannelService } from '../../../application/chatWorkflow/ChatChannelService'
import { ChatMessageService } from '../../../application/chatWorkflow/ChatMessageService'
import { parseInboundFrame } from '../../../application/chatWorkflow/wsFrame'
import type { ChatWsEvent } from './websocketTypes'
import { realtimeEndpoint, wsErrorResponse } from './websocketTypes'

const config = new Config<{ dynamodbTableName: string; awsRegion: string }>().getConfig()
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

async function chatMarkRead(event: ChatWsEvent): Promise<{ statusCode: number }> {
  const logger = createServiceLogger('chatMarkRead')
  try {
    const { connectionId } = event.requestContext
    if (connectionId === undefined) {
      return { statusCode: 400 }
    }
    const connectionService = new ChatConnectionService(chatConnectionDynamoDbOperations, logger)
    const channelService = new ChatChannelService(chatChannelDynamoDbOperations, logger)
    const messageService = new ChatMessageService(chatMessageDynamoDbOperations, logger)

    const userId = await connectionService.getConnectionUser(connectionId)
    const frame = parseInboundFrame(event.body)

    const realtime = new ApiGatewayManagementApiOperations(
      realtimeEndpoint(event.requestContext),
      config.awsRegion
    )
    await messageService.markRead(frame.channelId, userId, channelService, connectionService, realtime)

    return { statusCode: 200 }
  } catch (error) {
    return wsErrorResponse(error, logger, 'chatMarkRead')
  }
}

export default chatMarkRead
