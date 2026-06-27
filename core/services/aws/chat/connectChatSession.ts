import type { APIGatewayProxyResult } from 'aws-lambda'
import { HTTP_CODES } from '../../../../commons/libs/constants/GenericCodes'
import { Config } from '../../../../commons/libs/config/config'
import generateApiGatewayResponse from '../commons/lambda/ApiGateway'
import WsConnectionDynamoDbOperations from '../commons/ddbOperations/WsConnectionDynamoDbOperations'

// WebSocket $connect handler. The participant id comes only from the request
// authorizer context (the verified Cognito `sub`), never from client input, then the
// connectionId<->userId mapping is stored so messages can be routed back to this peer.
const config = new Config<{
  dynamodbTableName: string;
  awsRegion: string;
}>().getConfig()

const wsConnectionDynamoDbOperations = new WsConnectionDynamoDbOperations(
  config.dynamodbTableName,
  config.awsRegion
)

type ChatWsConnectEvent = {
  requestContext: {
    connectionId: string;
    authorizer?: { userId?: string } | null;
  };
}

const connectChatSession = async (
  event: ChatWsConnectEvent
): Promise<APIGatewayProxyResult> => {
  const userId = event.requestContext.authorizer?.userId
  const { connectionId } = event.requestContext
  if (userId === undefined || userId === '') {
    return generateApiGatewayResponse({ message: 'Unauthorized' }, HTTP_CODES.UNAUTHORIZED)
  }

  try {
    await wsConnectionDynamoDbOperations.putConnection({ userId, connectionId })

    return generateApiGatewayResponse({ message: 'Connected' }, HTTP_CODES.OK)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to connect'

    return generateApiGatewayResponse({ message }, HTTP_CODES.ERROR)
  }
}

export default connectChatSession
