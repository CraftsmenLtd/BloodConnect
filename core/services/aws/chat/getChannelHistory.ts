import type { APIGatewayProxyResult } from 'aws-lambda'
import type { ChatHistoryCursor } from '../../../../commons/dto/ChatDTO'
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

const DEFAULT_HISTORY_LIMIT = 50
const MAX_HISTORY_LIMIT = 100
const DECIMAL_RADIX = 10

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

type ChatHistoryRequestAttributes = {
  userId: string;
  channelId: string;
  limit?: string | number;
  cursor?: string;
}

const parseLimit = (raw?: string | number): number => {
  const parsed = typeof raw === 'number' ? raw : Number.parseInt(raw ?? '', DECIMAL_RADIX)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_HISTORY_LIMIT
  }

  return Math.min(parsed, MAX_HISTORY_LIMIT)
}

// Cursor travels as a base64-encoded JSON object (the DynamoDB LastEvaluatedKey).
// A value that does not decode to a plain object is rejected as a 400 by the caller.
const decodeCursor = (raw?: string): ChatHistoryCursor | undefined => {
  if (raw === undefined || raw === '') {
    return undefined
  }
  const parsed: unknown = JSON.parse(Buffer.from(raw, 'base64').toString('utf-8'))
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Invalid cursor')
  }

  return parsed as ChatHistoryCursor
}

const encodeCursor = (cursor?: ChatHistoryCursor): string | undefined =>
  cursor === undefined ? undefined : Buffer.from(JSON.stringify(cursor)).toString('base64')

const resolveStatusCode = (error: unknown): number =>
  error instanceof ApplicationError ? error.errorCode : HTTP_CODES.ERROR

async function getChannelHistoryLambda(
  event: ChatHistoryRequestAttributes & HttpLoggerAttributes
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

  let cursor: ChatHistoryCursor | undefined
  try {
    cursor = decodeCursor(event.cursor)
  } catch {
    return generateApiGatewayResponse({ message: 'Invalid cursor' }, HTTP_CODES.BAD_REQUEST)
  }

  try {
    const result = await chatMessageService.getHistory(
      event.channelId,
      event.userId,
      parseLimit(event.limit),
      cursor
    )

    return generateApiGatewayResponse(
      { messages: result.messages, nextCursor: encodeCursor(result.lastEvaluatedKey) },
      HTTP_CODES.OK
    )
  } catch (error) {
    httpLogger.error(error)
    const errorMessage = error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE

    return generateApiGatewayResponse({ message: errorMessage }, resolveStatusCode(error))
  }
}

export default getChannelHistoryLambda
