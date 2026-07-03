import chatSendMessage from '../../chat/chatSendMessage'
import { ChatConnectionService } from '../../../../application/chatWorkflow/ChatConnectionService'
import { ChatMessageService } from '../../../../application/chatWorkflow/ChatMessageService'
import { chatForbidden } from '../../../../application/chatWorkflow/ChatOperationError'
import { GENERIC_CODES } from '../../../../../commons/libs/constants/GenericCodes'
import type { ChatWsEvent } from '../../chat/websocketTypes'

jest.mock('../../../../application/chatWorkflow/ChatConnectionService')
jest.mock('../../../../application/chatWorkflow/ChatMessageService')
jest.mock('../../../../application/chatWorkflow/ChatChannelService')
jest.mock('../../commons/logger/ServiceLogger', () => ({
  createServiceLogger: () => ({ info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() })
}))

const mockConnection = ChatConnectionService as jest.MockedClass<typeof ChatConnectionService>
const mockMessage = ChatMessageService as jest.MockedClass<typeof ChatMessageService>

const sendFrame = JSON.stringify({
  action: 'sendMessage',
  channelId: 'req-1#donor-1',
  body: 'hello',
  clientMessageId: 'client-1'
})

const event = (body: string | null): ChatWsEvent => ({
  requestContext: { connectionId: 'c1', domainName: 'ws.example', stage: 'dev' },
  body
})

describe('chatSendMessage handler', () => {
  afterEach(() => jest.clearAllMocks())

  it('resolves the sender from the connection and delegates to ChatMessageService', async () => {
    mockConnection.prototype.getConnectionUser.mockResolvedValue('seeker-1')
    mockMessage.prototype.sendMessage.mockResolvedValue({
      channelId: 'req-1#donor-1',
      messageId: 'm1',
      clientMessageId: 'client-1',
      senderId: 'seeker-1',
      body: 'hello',
      sentAt: '2026-06-26T00:00:00.000Z',
      ttl: 1
    })

    const result = await chatSendMessage(event(sendFrame))

    expect(mockMessage.prototype.sendMessage).toHaveBeenCalledWith(
      { channelId: 'req-1#donor-1', senderId: 'seeker-1', body: 'hello', clientMessageId: 'client-1' },
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything()
    )
    expect(result.statusCode).toBe(200)
  })

  it('maps an unknown connection (403) to a 403 status', async () => {
    mockConnection.prototype.getConnectionUser.mockRejectedValue(chatForbidden('Unknown connection'))

    const result = await chatSendMessage(event(sendFrame))

    expect(result.statusCode).toBe(GENERIC_CODES.FORBIDDEN)
    expect(mockMessage.prototype.sendMessage).not.toHaveBeenCalled()
  })

  it('rejects a malformed frame', async () => {
    mockConnection.prototype.getConnectionUser.mockResolvedValue('seeker-1')

    const result = await chatSendMessage(event('not json'))

    expect(result.statusCode).toBe(GENERIC_CODES.BAD_REQUEST)
  })
})
