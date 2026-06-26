import type { APIGatewayProxyResult } from 'aws-lambda'
import { HTTP_CODES } from '../../../../commons/libs/constants/GenericCodes'
import generateApiGatewayResponse from '../commons/lambda/ApiGateway'
import { ChatService } from '../../../application/chatWorkflow/ChatService'
import ChatDynamoDbOperations from '../commons/ddbOperations/ChatDynamoDbOperations'
import ChatRateLimitDynamoDbOperations from '../commons/ddbOperations/ChatRateLimitDynamoDbOperations'
import type { HttpLoggerAttributes } from '../commons/logger/HttpLogger'
import { createHTTPLogger } from '../commons/logger/HttpLogger'
import { UNKNOWN_ERROR_MESSAGE } from '../../../../commons/libs/constants/ApiResponseMessages'
import { Config } from '../../../../commons/libs/config/config'

const config = new Config<{
  dynamodbTableName: string;
  awsRegion: string;
}>().getConfig()

const chatDynamoDbOperations = new ChatDynamoDbOperations(config.dynamodbTableName, config.awsRegion)
const chatRateLimitDynamoDbOperations = new ChatRateLimitDynamoDbOperations(
  config.dynamodbTableName,
  config.awsRegion
)

// Lists the caller's own chat channels (their membership items), each carrying lastMessageAt and
// the caller's lastReadAt so the client derives the unread indicator.
async function chatListChannels(
  event: HttpLoggerAttributes
): Promise<APIGatewayProxyResult> {
  const httpLogger = createHTTPLogger(event.userId, event.apiGwRequestId, event.cloudFrontRequestId)
  const chatService = new ChatService(
    chatDynamoDbOperations,
    chatRateLimitDynamoDbOperations,
    httpLogger
  )

  try {
    const channels = await chatService.listChannels(event.userId)

    return generateApiGatewayResponse({ success: true, data: channels }, HTTP_CODES.OK)
  } catch (error) {
    httpLogger.error(error)
    const errorMessage = error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE

    return generateApiGatewayResponse(`Error: ${errorMessage}`, HTTP_CODES.ERROR)
  }
}

export default chatListChannels
