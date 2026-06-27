import { HTTP_CODES } from '../../../../../commons/libs/constants/GenericCodes'
import { ChatMessageService } from '../../../../application/chatWorkflow/ChatMessageService'
import { NotParticipantError } from '../../../../application/chatWorkflow/ChatErrors'
import markChannelReadLambda from '../../chat/markChannelRead'

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
const otherParticipant = 'donor1'

const loggerAttributes = {
  apiGwRequestId: 'api-req-1',
  cloudFrontRequestId: 'cf-req-1'
}

describe('markChannelReadLambda', () => {
  const mockedChatMessageService = ChatMessageService as jest.MockedClass<typeof ChatMessageService>
  const markRead = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockedChatMessageService.prototype.markRead = markRead
  })

  it('resets the unread count when the caller opens the channel', async () => {
    markRead.mockResolvedValue(undefined)

    const response = await markChannelReadLambda({ channelId, userId, ...loggerAttributes })

    expect(response.statusCode).toBe(HTTP_CODES.OK)
    expect(markRead).toHaveBeenCalledWith(channelId, userId)
  })

  it('returns 403 when the caller is not a participant', async () => {
    markRead.mockRejectedValue(new NotParticipantError())

    const response = await markChannelReadLambda({ channelId, userId: 'intruder', ...loggerAttributes })

    expect(response.statusCode).toBe(FORBIDDEN_STATUS)
  })

  it('only resets the caller pointer, never the other participant', async () => {
    markRead.mockResolvedValue(undefined)

    await markChannelReadLambda({ channelId, userId, ...loggerAttributes })

    expect(markRead).toHaveBeenCalledTimes(1)
    expect(markRead).toHaveBeenCalledWith(channelId, userId)
    expect(markRead).not.toHaveBeenCalledWith(channelId, otherParticipant)
  })
})
