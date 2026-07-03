import { Config } from '../../../../commons/libs/config/config'
import { createServiceLogger } from '../commons/logger/ServiceLogger'
import ChatConnectionDynamoDbOperations from '../commons/ddbOperations/ChatConnectionDynamoDbOperations'
import { ChatConnectionService } from '../../../application/chatWorkflow/ChatConnectionService'
import type { ChatWsEvent } from './websocketTypes'
import { wsErrorResponse } from './websocketTypes'

const config = new Config<{ dynamodbTableName: string; awsRegion: string }>().getConfig()
const chatConnectionDynamoDbOperations = new ChatConnectionDynamoDbOperations(
  config.dynamodbTableName,
  config.awsRegion
)

async function chatDisconnect(event: ChatWsEvent): Promise<{ statusCode: number }> {
  const logger = createServiceLogger('chatDisconnect')
  try {
    const { connectionId } = event.requestContext
    if (connectionId === undefined) {
      return { statusCode: 400 }
    }
    const connectionService = new ChatConnectionService(chatConnectionDynamoDbOperations, logger)
    await connectionService.removeConnection(connectionId)

    return { statusCode: 200 }
  } catch (error) {
    return wsErrorResponse(error, logger, 'chatDisconnect')
  }
}

export default chatDisconnect
