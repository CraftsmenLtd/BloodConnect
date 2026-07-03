import type { APIGatewayProxyResult } from 'aws-lambda'
import { HTTP_CODES } from '../../../../commons/libs/constants/GenericCodes'
import generateApiGatewayResponse from '../commons/lambda/ApiGateway'
import { Config } from '../../../../commons/libs/config/config'
import type { HttpLoggerAttributes } from '../commons/logger/HttpLogger'
import { createHTTPLogger } from '../commons/logger/HttpLogger'
import ChatChannelDynamoDbOperations from '../commons/ddbOperations/ChatChannelDynamoDbOperations'
import { ChatChannelService } from '../../../application/chatWorkflow/ChatChannelService'
import type { GetChatChannelsEvent } from '../../../application/chatWorkflow/Types'
import { clampLimit, decodeCursor, encodeCursor } from '../../../application/chatWorkflow/cursor'
import ChatOperationError from '../../../application/chatWorkflow/ChatOperationError'
import { UNKNOWN_ERROR_MESSAGE } from '../../../../commons/libs/constants/ApiResponseMessages'

const config = new Config<{ dynamodbTableName: string; awsRegion: string }>().getConfig()
const chatChannelDynamoDbOperations = new ChatChannelDynamoDbOperations(
  config.dynamodbTableName,
  config.awsRegion
)

async function chatListChannelsLambda(
  event: GetChatChannelsEvent & HttpLoggerAttributes
): Promise<APIGatewayProxyResult> {
  const httpLogger = createHTTPLogger(
    event.requesterId,
    event.apiGwRequestId,
    event.cloudFrontRequestId
  )
  const channelService = new ChatChannelService(chatChannelDynamoDbOperations, httpLogger)

  try {
    const { requesterId, cursor, limit } = event
    const decodedCursor = cursor !== undefined && cursor !== '' ? decodeCursor(cursor) : undefined
    const page = await channelService.listChannelsForUser(
      requesterId,
      clampLimit(limit),
      decodedCursor
    )

    return generateApiGatewayResponse(
      {
        success: true,
        data: {
          items: page.items,
          nextCursor: page.nextCursor !== undefined ? encodeCursor(page.nextCursor) : null
        }
      },
      HTTP_CODES.OK
    )
  } catch (error) {
    httpLogger.error(error)
    const errorMessage = error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE
    const errorCode = error instanceof ChatOperationError ? error.errorCode : HTTP_CODES.ERROR

    return generateApiGatewayResponse(`Error: ${errorMessage}`, errorCode)
  }
}

export default chatListChannelsLambda
