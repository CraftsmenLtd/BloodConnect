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

// WebSocket $connect: the request authorizer has already validated the JWT and put the userId in
// the authorizer context; store the connection keyed by connectionId (with userId on GSI1 for fanout).
type ConnectEvent = {
  requestContext: {
    connectionId: string;
    authorizer?: { userId?: string };
  };
}

async function chatConnect(event: ConnectEvent): Promise<{ statusCode: number }> {
  const { connectionId, authorizer } = event.requestContext
  const userId = authorizer?.userId
  const logger = createServiceLogger(userId ?? 'unknown', { connectionId })

  if (userId === undefined || userId === '') {
    logger.error('missing userId in authorizer context')

    return { statusCode: 401 }
  }

  await chatConnectionOperations.put({
    connectionId,
    userId,
    createdAt: new Date().toISOString()
  })

  return { statusCode: 200 }
}

export default chatConnect
