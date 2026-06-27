import type { APIGatewayProxyResult } from 'aws-lambda'
import { HTTP_CODES } from '../../../../commons/libs/constants/GenericCodes'
import { UNKNOWN_ERROR_MESSAGE } from '../../../../commons/libs/constants/ApiResponseMessages'
import ApplicationError from '../../../../commons/libs/errors/ApplicationError'
import { Config } from '../../../../commons/libs/config/config'
import generateApiGatewayResponse from '../commons/lambda/ApiGateway'
import type { HttpLoggerAttributes } from '../commons/logger/HttpLogger'
import { createHTTPLogger } from '../commons/logger/HttpLogger'
import { ChatMessageService } from '../../../application/chatWorkflow/ChatMessageService'
import ChatMessageDynamoDbOperations from '../commons/ddbOperations/ChatMessageDynamoDbOperations'
import ChatChannelDynamoDbOperations from '../commons/ddbOperations/ChatChannelDynamoDbOperations'

const config = new Config<{
  dynamodbTableName: string;
  awsRegion: string;
}>().getConfig()

const chatMessageDynamoDbOperations = new ChatMessageDynamoDbOperations(
  config.dynamodbTableName,
  config.awsRegion
)
const chatChannelDynamoDbOperations = new ChatChannelDynamoDbOperations(
  config.dynamodbTableName,
  config.awsRegion
)

type MarkChannelReadRequestAttributes = {
  userId: string;
  channelId: string;
}

const resolveStatusCode = (error: unknown): number =>
  error instanceof ApplicationError ? error.errorCode : HTTP_CODES.ERROR

// POST /chat/{channelId}/read — resets only the caller's inbox pointer (unreadCount = 0).
// markRead is participant-checked, so a non-participant surfaces as NotParticipantError → 403.
async function markChannelReadLambda(
  event: MarkChannelReadRequestAttributes & HttpLoggerAttributes
): Promise<APIGatewayProxyResult> {
  const httpLogger = createHTTPLogger(
    event.userId,
    event.apiGwRequestId,
    event.cloudFrontRequestId
  )
  const chatMessageService = new ChatMessageService(
    chatMessageDynamoDbOperations,
    chatChannelDynamoDbOperations
  )

  try {
    await chatMessageService.markRead(event.channelId, event.userId)

    return generateApiGatewayResponse({ success: true }, HTTP_CODES.OK)
  } catch (error) {
    httpLogger.error(error)
    const errorMessage = error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE

    return generateApiGatewayResponse({ message: errorMessage }, resolveStatusCode(error))
  }
}

export default markChannelReadLambda
