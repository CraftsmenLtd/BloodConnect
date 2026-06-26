import ChatConnectionDynamoDbOperations from '../commons/ddbOperations/ChatConnectionDynamoDbOperations'
import { Config } from '../../../../commons/libs/config/config'
import { createServiceLogger } from '../commons/logger/ServiceLogger'

const config = new Config<{
  dynamodbTableName: string;
  awsRegion: string;
}>().getConfig()

const chatConnectionOperations = new ChatConnectionDynamoDbOperations(
  config.dynamodbTableName,
  config.awsRegion
)

// WebSocket $disconnect carries only the connectionId (no authorizer re-run), so the connection
// item is keyed and deleted by connectionId alone.
type DisconnectEvent = {
  requestContext: {
    connectionId: string;
  };
}

async function chatDisconnect(event: DisconnectEvent): Promise<{ statusCode: number }> {
  const { connectionId } = event.requestContext
  const logger = createServiceLogger(connectionId, { connectionId })

  await chatConnectionOperations.deleteByConnectionId(connectionId)
  logger.info('connection removed')

  return { statusCode: 200 }
}

export default chatDisconnect
