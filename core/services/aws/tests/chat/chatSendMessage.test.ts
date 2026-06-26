const mockGetByConnectionId = jest.fn()
const mockQueryByUserId = jest.fn()
const mockDeleteByConnectionId = jest.fn()
const mockSendMessage = jest.fn()
const mockPostToConnection = jest.fn()
const mockQueue = jest.fn()

jest.mock('../../commons/ddbOperations/ChatConnectionDynamoDbOperations', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    getByConnectionId: mockGetByConnectionId,
    queryByUserId: mockQueryByUserId,
    deleteByConnectionId: mockDeleteByConnectionId
  }))
}))
jest.mock('../../commons/ddbOperations/ChatDynamoDbOperations')
jest.mock('../../commons/ddbOperations/ChatRateLimitDynamoDbOperations')
jest.mock('../../../../application/chatWorkflow/ChatService', () => ({
  ChatService: jest.fn().mockImplementation(() => ({ sendMessage: mockSendMessage }))
}))
jest.mock('../../commons/apiGateway/WebSocketOperations', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({ postToConnection: mockPostToConnection }))
}))
jest.mock('../../commons/sqs/SQSOperations', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({ queue: mockQueue }))
}))
jest.mock('../../commons/logger/ServiceLogger', () => ({
  createServiceLogger: jest.fn(() => ({
    info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn()
  }))
}))

import chatSendMessage from '../../chat/chatSendMessage'
import NotChannelParticipantError from '../../../../application/chatWorkflow/NotChannelParticipantError'
import { NotificationType } from '../../../../../commons/dto/NotificationDTO'

const CHANNEL_ID = 'seeker-1#req-1#donor-1'

const savedMessage = {
  channelId: CHANNEL_ID,
  messageId: 'msg-1',
  senderId: 'seeker-1',
  content: 'hello',
  createdAt: '2026-06-26T00:00:00.000Z'
}

const event = (body: unknown) => ({
  requestContext: { connectionId: 'conn-sender', domainName: 'ws.example.com', stage: 'dev' },
  body: JSON.stringify(body)
})

describe('chatSendMessage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetByConnectionId.mockResolvedValue({ connectionId: 'conn-sender', userId: 'seeker-1' })
    mockSendMessage.mockResolvedValue(savedMessage)
    mockPostToConnection.mockResolvedValue({ gone: false })
  })

  test('rejects a non-participant with the error code and does not fan out', async() => {
    mockSendMessage.mockRejectedValue(
      new NotChannelParticipantError('not a participant', 401)
    )

    const result = await chatSendMessage(event({ channelId: CHANNEL_ID, content: 'hi' }))

    expect(result.statusCode).toBe(401)
    expect(mockPostToConnection).not.toHaveBeenCalled()
    expect(mockQueue).not.toHaveBeenCalled()
  })

  test('rejects with 400 on a malformed body', async() => {
    const result = await chatSendMessage(event({ channelId: CHANNEL_ID }))

    expect(result.statusCode).toBe(400)
    expect(mockSendMessage).not.toHaveBeenCalled()
  })

  test('delivers to both participants\' live connections', async() => {
    mockQueryByUserId.mockImplementation(async(userId: string) =>
      userId === 'seeker-1'
        ? [{ connectionId: 'conn-sender', userId }]
        : [{ connectionId: 'conn-donor', userId }]
    )

    const result = await chatSendMessage(event({ channelId: CHANNEL_ID, content: 'hello' }))

    expect(result.statusCode).toBe(200)
    expect(mockPostToConnection).toHaveBeenCalledWith('conn-sender', savedMessage)
    expect(mockPostToConnection).toHaveBeenCalledWith('conn-donor', savedMessage)
    expect(mockQueue).not.toHaveBeenCalled()
  })

  test('prunes a stale connection on GoneException', async() => {
    mockQueryByUserId.mockImplementation(async(userId: string) =>
      userId === 'donor-1' ? [{ connectionId: 'conn-stale', userId }] : []
    )
    mockPostToConnection.mockResolvedValue({ gone: true })

    await chatSendMessage(event({ channelId: CHANNEL_ID, content: 'hello' }))

    expect(mockDeleteByConnectionId).toHaveBeenCalledWith('conn-stale')
  })

  test('enqueues a CHAT_MESSAGE push for an offline recipient', async() => {
    mockQueryByUserId.mockImplementation(async(userId: string) =>
      userId === 'seeker-1' ? [{ connectionId: 'conn-sender', userId }] : []
    )

    await chatSendMessage(event({ channelId: CHANNEL_ID, content: 'hello' }))

    expect(mockQueue).toHaveBeenCalledTimes(1)
    const [notification] = mockQueue.mock.calls[0]
    expect(notification).toEqual(expect.objectContaining({
      userId: 'donor-1',
      type: NotificationType.CHAT_MESSAGE
    }))
  })

  test('does not enqueue a push for the offline sender themselves', async() => {
    mockQueryByUserId.mockImplementation(async(userId: string) =>
      userId === 'donor-1' ? [{ connectionId: 'conn-donor', userId }] : []
    )

    await chatSendMessage(event({ channelId: CHANNEL_ID, content: 'hello' }))

    expect(mockQueue).not.toHaveBeenCalled()
  })
})
