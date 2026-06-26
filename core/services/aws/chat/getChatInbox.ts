import type { APIGatewayProxyResult } from 'aws-lambda'
import { HTTP_CODES } from '../../../../commons/libs/constants/GenericCodes'
import generateApiGatewayResponse from '../commons/lambda/ApiGateway'
import { ChatService } from '../../../application/chatWorkflow/ChatService'
import ChatOperationError from '../../../application/chatWorkflow/ChatOperationError'
import ChatChannelDynamoDbOperations from '../commons/ddbOperations/ChatChannelDynamoDbOperations'
import ChatMessageDynamoDbOperations from '../commons/ddbOperations/ChatMessageDynamoDbOperations'
import UserChannelDynamoDbOperations from '../commons/ddbOperations/UserChannelDynamoDbOperations'
import type { HttpLoggerAttributes } from '../commons/logger/HttpLogger'
import { createHTTPLogger } from '../commons/logger/HttpLogger'
import {
  CHAT_INBOX_FETCHED_SUCCESS,
  UNKNOWN_ERROR_MESSAGE
} from '../../../../commons/libs/constants/ApiResponseMessages'
import { Config } from '../../../../commons/libs/config/config'

const config = new Config<{
  chatDynamodbTableName: string;
  awsRegion: string;
}>().getConfig()

const chatChannelOperations = new ChatChannelDynamoDbOperations(
  config.chatDynamodbTableName,
  config.awsRegion
)
const chatMessageOperations = new ChatMessageDynamoDbOperations(
  config.chatDynamodbTableName,
  config.awsRegion
)
const userChannelOperations = new UserChannelDynamoDbOperations(
  config.chatDynamodbTableName,
  config.awsRegion
)

type GetChatInboxEvent = HttpLoggerAttributes & {
  limit?: string;
  nextKey?: string;
}

async function getChatInbox(event: GetChatInboxEvent): Promise<APIGatewayProxyResult> {
  const httpLogger = createHTTPLogger(
    event.userId,
    event.apiGwRequestId,
    event.cloudFrontRequestId
  )
  const chatService = new ChatService(
    chatChannelOperations,
    chatMessageOperations,
    userChannelOperations,
    httpLogger
  )

  try {
    const limit = event.limit !== undefined && event.limit !== '' ? Number(event.limit) : undefined
    const exclusiveStartKey = parseStartKey(event.nextKey)

    const result = await chatService.getInbox(event.userId, limit, exclusiveStartKey)

    return generateApiGatewayResponse(
      {
        success: true,
        message: CHAT_INBOX_FETCHED_SUCCESS,
        data: {
          channels: result.items,
          lastEvaluatedKey: result.lastEvaluatedKey
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

function parseStartKey(nextKey?: string): Record<string, unknown> | undefined {
  if (nextKey === undefined || nextKey === '') {
    return undefined
  }
  try {
    return JSON.parse(nextKey) as Record<string, unknown>
  } catch {
    return undefined
  }
}

export default getChatInbox
