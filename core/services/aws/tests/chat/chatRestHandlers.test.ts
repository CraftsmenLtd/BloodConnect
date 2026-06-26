const mockListChannels = jest.fn()
const mockGetHistory = jest.fn()
const mockMarkRead = jest.fn()

jest.mock('../../../../application/chatWorkflow/ChatService', () => ({
  ChatService: jest.fn().mockImplementation(() => ({
    listChannels: mockListChannels,
    getHistory: mockGetHistory,
    markRead: mockMarkRead
  }))
}))
jest.mock('../../commons/ddbOperations/ChatDynamoDbOperations')
jest.mock('../../commons/ddbOperations/ChatRateLimitDynamoDbOperations')
jest.mock('../../commons/logger/HttpLogger', () => ({
  createHTTPLogger: jest.fn(() => ({
    info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn()
  }))
}))

import chatListChannels from '../../chat/chatListChannels'
import chatGetHistory from '../../chat/chatGetHistory'
import chatMarkRead from '../../chat/chatMarkRead'
import { ChatRole } from '../../../../../commons/dto/ChatDTO'

const CHANNEL_ID = 'seeker-1#req-1#donor-1'
const loggerAttrs = { apiGwRequestId: 'api-1', cloudFrontRequestId: 'cf-1' }

describe('chatListChannels', () => {
  beforeEach(() => jest.clearAllMocks())

  test('returns the caller\'s channels across both roles', async() => {
    mockListChannels.mockResolvedValue([
      { userId: 'user-x', channelId: 'user-x#r#d', role: ChatRole.SEEKER, createdAt: 'x' },
      { userId: 'user-x', channelId: 's#r#user-x', role: ChatRole.DONOR, createdAt: 'x' }
    ])

    const result = await chatListChannels({ userId: 'user-x', ...loggerAttrs })

    expect(result.statusCode).toBe(200)
    expect(mockListChannels).toHaveBeenCalledWith('user-x')
    expect(JSON.parse(result.body).data).toHaveLength(2)
  })
})

describe('chatGetHistory', () => {
  beforeEach(() => jest.clearAllMocks())

  test('rejects a non-participant with 401', async() => {
    const result = await chatGetHistory({ userId: 'intruder', channelId: CHANNEL_ID, ...loggerAttrs })

    expect(result.statusCode).toBe(401)
    expect(mockGetHistory).not.toHaveBeenCalled()
  })

  test('returns a paginated page for a participant', async() => {
    const page = { items: [{ messageId: 'm2' }, { messageId: 'm1' }], lastEvaluatedKey: { SK: 'm1' } }
    mockGetHistory.mockResolvedValue(page)

    const cursor = { SK: 'm3' }
    const result = await chatGetHistory({
      userId: 'donor-1',
      channelId: CHANNEL_ID,
      limit: 25,
      exclusiveStartKey: cursor,
      ...loggerAttrs
    })

    expect(result.statusCode).toBe(200)
    expect(mockGetHistory).toHaveBeenCalledWith(CHANNEL_ID, 25, cursor)
    expect(JSON.parse(result.body).data.items).toHaveLength(2)
  })
})

describe('chatMarkRead', () => {
  beforeEach(() => jest.clearAllMocks())

  test('rejects a non-participant with 401', async() => {
    const result = await chatMarkRead({ userId: 'intruder', channelId: CHANNEL_ID, ...loggerAttrs })

    expect(result.statusCode).toBe(401)
    expect(mockMarkRead).not.toHaveBeenCalled()
  })

  test('marks read for the calling participant only', async() => {
    mockMarkRead.mockResolvedValue(undefined)

    const result = await chatMarkRead({ userId: 'seeker-1', channelId: CHANNEL_ID, ...loggerAttrs })

    expect(result.statusCode).toBe(200)
    expect(mockMarkRead).toHaveBeenCalledWith('seeker-1', CHANNEL_ID)
  })
})
