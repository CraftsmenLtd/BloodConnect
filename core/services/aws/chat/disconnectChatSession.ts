import type { APIGatewayProxyResult } from 'aws-lambda'
import { HTTP_CODES } from '../../../../commons/libs/constants/GenericCodes'
import { Config } from '../../../../commons/libs/config/config'
import generateApiGatewayResponse from '../commons/lambda/ApiGateway'
import WsConnectionDynamoDbOperations from '../commons/ddbOperations/WsConnectionDynamoDbOperations'

// WebSocket $disconnect handler. Removes the connectionId<->userId mapping written at
// $connect; the participant id is taken from the authorizer context, never from input.
const config = new Config<{
  dynamodbTableName: string;
  awsRegion: string;
}>().getConfig()

const wsConnectionDynamoDbOperations = new WsConnectionDynamoDbOperations(
  config.dynamodbTableName,
  config.awsRegion
)

type ChatWsDisconnectEvent = {
  requestContext: {
    connectionId: string;
    authorizer?: { userId?: string } | null;
  };
}

const disconnectChatSession = async (
  event: ChatWsDisconnectEvent
): Promise<APIGatewayProxyResult> => {
  const userId = event.requestContext.authorizer?.userId
  const { connectionId } = event.requestContext
  if (userId === undefined || userId === '') {
    return generateApiGatewayResponse({ message: 'Unauthorized' }, HTTP_CODES.UNAUTHORIZED)
  }

  try {
    await wsConnectionDynamoDbOperations.deleteConnection(userId, connectionId)

    return generateApiGatewayResponse({ message: 'Disconnected' }, HTTP_CODES.OK)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to disconnect'

    return generateApiGatewayResponse({ message }, HTTP_CODES.ERROR)
  }
}

export default disconnectChatSession
