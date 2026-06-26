import type { APIGatewayProxyWebsocketEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { ChatConnectionService } from '../../../application/chatWorkflow/ChatConnectionService'
import ChatConnectionDynamoDbOperations from '../commons/ddbOperations/ChatConnectionDynamoDbOperations'
import { Config } from '../../../../commons/libs/config/config'
import { createServiceLogger } from '../commons/logger/ServiceLogger'
import { HTTP_CODES } from '../../../../commons/libs/constants/GenericCodes'

const config = new Config<{
  chatDynamodbTableName: string;
  awsRegion: string;
}>().getConfig()

const chatConnectionOperations = new ChatConnectionDynamoDbOperations(
  config.chatDynamodbTableName,
  config.awsRegion
)

type WebsocketRequestContextWithAuthorizer =
  APIGatewayProxyWebsocketEventV2['requestContext'] & {
    authorizer?: { userId?: string };
  }

async function connect(
  event: APIGatewayProxyWebsocketEventV2
): Promise<APIGatewayProxyResultV2> {
  const requestContext = event.requestContext as WebsocketRequestContextWithAuthorizer
  const connectionId = requestContext.connectionId
  const userId = requestContext.authorizer?.userId ?? ''

  if (userId === '') {
    return { statusCode: HTTP_CODES.UNAUTHORIZED, body: 'Unauthorized' }
  }

  const logger = createServiceLogger(userId, { connectionId })
  const chatConnectionService = new ChatConnectionService(chatConnectionOperations, logger)

  try {
    await chatConnectionService.registerConnection({ connectionId, userId })

    return { statusCode: HTTP_CODES.OK, body: 'Connected' }
  } catch (error) {
    logger.error('Failed to register websocket connection', error)

    return { statusCode: HTTP_CODES.ERROR, body: 'Failed to connect' }
  }
}

export default connect
