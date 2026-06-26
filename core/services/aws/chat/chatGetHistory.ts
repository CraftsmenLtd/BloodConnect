import type { APIGatewayProxyResult } from 'aws-lambda'
import { HTTP_CODES } from '../../../../commons/libs/constants/GenericCodes'
import generateApiGatewayResponse from '../commons/lambda/ApiGateway'
import { isChannelParticipant } from '../../../../commons/dto/ChatDTO'
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

type GetHistoryEvent = HttpLoggerAttributes & {
  channelId: string;
  limit?: number;
  exclusiveStartKey?: Record<string, unknown>;
}

// Returns a newest-first, paginated page of a channel's messages; participant-only.
async function chatGetHistory(event: GetHistoryEvent): Promise<APIGatewayProxyResult> {
  const httpLogger = createHTTPLogger(event.userId, event.apiGwRequestId, event.cloudFrontRequestId)

  if (!isChannelParticipant(event.userId, event.channelId)) {
    return generateApiGatewayResponse('Error: Not a participant of this channel.', HTTP_CODES.UNAUTHORIZED)
  }

  const chatService = new ChatService(
    chatDynamoDbOperations,
    chatRateLimitDynamoDbOperations,
    httpLogger
  )

  try {
    const result = await chatService.getHistory(event.channelId, event.limit, event.exclusiveStartKey)

    return generateApiGatewayResponse({ success: true, data: result }, HTTP_CODES.OK)
  } catch (error) {
    httpLogger.error(error)
    const errorMessage = error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE

    return generateApiGatewayResponse(`Error: ${errorMessage}`, HTTP_CODES.ERROR)
  }
}

export default chatGetHistory
