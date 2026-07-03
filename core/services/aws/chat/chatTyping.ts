import { Config } from '../../../../commons/libs/config/config'
import { createServiceLogger } from '../commons/logger/ServiceLogger'
import ChatConnectionDynamoDbOperations from '../commons/ddbOperations/ChatConnectionDynamoDbOperations'
import ChatChannelDynamoDbOperations from '../commons/ddbOperations/ChatChannelDynamoDbOperations'
import ApiGatewayManagementApiOperations from '../commons/realtime/ApiGatewayManagementApiOperations'
import { ChatConnectionService } from '../../../application/chatWorkflow/ChatConnectionService'
import { ChatChannelService } from '../../../application/chatWorkflow/ChatChannelService'
import { parseInboundFrame } from '../../../application/chatWorkflow/wsFrame'
import { chatNotFound } from '../../../application/chatWorkflow/ChatOperationError'
import { ChatRealtimeEventType } from '../../../../commons/dto/ChatDTO'
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

async function chatTyping(event: ChatWsEvent): Promise<{ statusCode: number }> {
  const logger = createServiceLogger('chatTyping')
  try {
    const { connectionId } = event.requestContext
    if (connectionId === undefined) {
      return { statusCode: 400 }
    }
    const connectionService = new ChatConnectionService(chatConnectionDynamoDbOperations, logger)
    const channelService = new ChatChannelService(chatChannelDynamoDbOperations, logger)

    const senderId = await connectionService.getConnectionUser(connectionId)
    const frame = parseInboundFrame(event.body)

    const channel = await channelService.getChannel(frame.channelId)
    if (channel === null) {
      throw chatNotFound()
    }
    channelService.assertParticipant(channel, senderId)

    const otherId = channelService.otherParticipant(channel, senderId)
    const connections = await connectionService.getConnectionsForUser(otherId)
    if (connections.length > 0) {
      const realtime = new ApiGatewayManagementApiOperations(
        realtimeEndpoint(event.requestContext),
        config.awsRegion
      )
      const { staleConnectionIds } = await realtime.postToConnections(connections, {
        type: ChatRealtimeEventType.TYPING,
        channelId: frame.channelId,
        userId: senderId
      })
      await Promise.all(
        staleConnectionIds.map((id) => connectionService.removeConnection(id))
      )
    }

    return { statusCode: 200 }
  } catch (error) {
    return wsErrorResponse(error, logger, 'chatTyping')
  }
}

export default chatTyping
