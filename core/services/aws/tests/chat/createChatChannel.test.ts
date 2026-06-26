import createChatChannel from '../../chat/createChatChannel'
import { ChatService } from '../../../../application/chatWorkflow/ChatService'

jest.mock('../../../../application/chatWorkflow/ChatService')
jest.mock('../../commons/logger/ServiceLogger', () => ({
  createServiceLogger: jest.fn(() => ({
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }))
}))

const mockChatService = ChatService as jest.MockedClass<typeof ChatService>

describe('createChatChannel', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('creates a channel from an accepted-donation stream record', async () => {
    mockChatService.prototype.createChannel.mockResolvedValue({
      channelId: 'channel-1',
      seekerId: 'seeker-1',
      requestPostId: 'request-1',
      donorId: 'donor-1',
      locked: false,
      createdAt: '2024-01-01T00:00:00Z'
    })

    const result = await createChatChannel({
      PK: 'BLOOD_REQ#seeker-1',
      SK: 'ACCEPTED#request-1#donor-1'
    })

    expect(result).toEqual({ status: 'Success' })
    expect(mockChatService.prototype.createChannel).toHaveBeenCalledWith({
      seekerId: 'seeker-1',
      requestPostId: 'request-1',
      donorId: 'donor-1'
    })
  })

  it('throws when PK or SK is missing', async () => {
    await expect(createChatChannel({ PK: '', SK: '' })).rejects.toThrow(
      'Missing PK or SK in the DynamoDB record'
    )
  })
})
