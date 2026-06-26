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

async function disconnect(
  event: APIGatewayProxyWebsocketEventV2
): Promise<APIGatewayProxyResultV2> {
  const connectionId = event.requestContext.connectionId
  const logger = createServiceLogger(connectionId, { connectionId })
  const chatConnectionService = new ChatConnectionService(chatConnectionOperations, logger)

  await chatConnectionService.removeConnection(connectionId)

  return { statusCode: HTTP_CODES.OK, body: 'Disconnected' }
}

export default disconnect
