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

async function chatConnect(event: ChatWsEvent): Promise<{ statusCode: number }> {
  const logger = createServiceLogger('chatConnect')
  try {
    const userId = event.requestContext.authorizer?.userId
    const { connectionId } = event.requestContext
    if (userId === undefined || connectionId === undefined) {
      return { statusCode: 401 }
    }
    const connectionService = new ChatConnectionService(chatConnectionDynamoDbOperations, logger)
    await connectionService.registerConnection(connectionId, userId)

    return { statusCode: 200 }
  } catch (error) {
    return wsErrorResponse(error, logger, 'chatConnect')
  }
}

export default chatConnect
