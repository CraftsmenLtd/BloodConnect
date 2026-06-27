import type { APIGatewayProxyResult } from 'aws-lambda'
import type { ChatMessageDTO, ChatHistoryCursor } from '../../../../../commons/dto/ChatDTO'
import { HTTP_CODES } from '../../../../../commons/libs/constants/GenericCodes'
import { ChatMessageService } from '../../../../application/chatWorkflow/ChatMessageService'
import { NotParticipantError } from '../../../../application/chatWorkflow/ChatErrors'
import getChannelHistoryLambda from '../../chat/getChannelHistory'

jest.mock('../../../../application/chatWorkflow/ChatMessageService')
jest.mock('../../commons/ddbOperations/DynamoDbTableOperations')
jest.mock('../../commons/ddbOperations/ChatMessageDynamoDbOperations')
jest.mock('../../commons/ddbOperations/ChatChannelDynamoDbOperations')
jest.mock('../../commons/logger/HttpLogger', () => ({
  createHTTPLogger: jest.fn(() => ({
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }))
}))
jest.mock('../../../../../commons/libs/config/config', () => ({
  Config: jest.fn().mockImplementation(() => ({
    getConfig: () => ({ dynamodbTableName: 'test-table', awsRegion: 'us-east-1' })
  }))
}))

// NotParticipantError maps to 403; GENERIC_CODES has no FORBIDDEN entry (see ChatErrors).
const FORBIDDEN_STATUS = 403
const channelId = 'seeker1#req1#donor1'
const userId = 'seeker1'

const loggerAttributes = {
  apiGwRequestId: 'api-req-1',
  cloudFrontRequestId: 'cf-req-1'
}

const buildMessage = (messageId: string): ChatMessageDTO => ({
  channelId,
  messageId,
  senderId: userId,
  text: `message ${messageId}`,
  createdAt: '2026-06-26T00:00:00.000Z',
  expiresAt: 1781308800
})

const encodeCursor = (cursor: ChatHistoryCursor): string =>
  Buffer.from(JSON.stringify(cursor)).toString('base64')

const parseBody = (response: APIGatewayProxyResult): Record<string, unknown> =>
  JSON.parse(response.body) as Record<string, unknown>

describe('getChannelHistoryLambda', () => {
  const mockedChatMessageService = ChatMessageService as jest.MockedClass<typeof ChatMessageService>
  const getHistory = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockedChatMessageService.prototype.getHistory = getHistory
  })

  it('returns 403 when the user is not a participant', async () => {
    getHistory.mockRejectedValue(new NotParticipantError())

    const response = await getChannelHistoryLambda({ channelId, userId: 'intruder', ...loggerAttributes })

    expect(response.statusCode).toBe(FORBIDDEN_STATUS)
  })

  it('returns a page plus an encoded nextCursor', async () => {
    const lastEvaluatedKey: ChatHistoryCursor = { SK: 'MSG#2' }
    getHistory.mockResolvedValue({ messages: [buildMessage('1'), buildMessage('2')], lastEvaluatedKey })

    const response = await getChannelHistoryLambda({ channelId, userId, limit: 2, ...loggerAttributes })
    const body = parseBody(response)

    expect(response.statusCode).toBe(HTTP_CODES.OK)
    expect((body.messages as ChatMessageDTO[])).toHaveLength(2)
    expect(body.nextCursor).toBe(encodeCursor(lastEvaluatedKey))
    expect(getHistory).toHaveBeenCalledWith(channelId, userId, 2, undefined)
  })

  it('forwards the decoded cursor to fetch the next page', async () => {
    const cursor: ChatHistoryCursor = { SK: 'MSG#2' }
    getHistory.mockResolvedValue({ messages: [buildMessage('3')], lastEvaluatedKey: undefined })

    const response = await getChannelHistoryLambda({
      channelId,
      userId,
      cursor: encodeCursor(cursor),
      ...loggerAttributes
    })
    const body = parseBody(response)

    expect(response.statusCode).toBe(HTTP_CODES.OK)
    expect(getHistory).toHaveBeenCalledWith(channelId, userId, 50, cursor)
    expect(body.nextCursor).toBeUndefined()
  })

  it('returns 400 on an undecodable cursor without calling the service', async () => {
    const response = await getChannelHistoryLambda({
      channelId,
      userId,
      cursor: 'not-valid-base64-json',
      ...loggerAttributes
    })

    expect(response.statusCode).toBe(HTTP_CODES.BAD_REQUEST)
    expect(getHistory).not.toHaveBeenCalled()
  })
})
