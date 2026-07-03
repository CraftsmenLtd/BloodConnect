import chatGetHistory from '../../chat/chatGetHistory'
import { ChatMessageService } from '../../../../application/chatWorkflow/ChatMessageService'
import { chatForbidden } from '../../../../application/chatWorkflow/ChatOperationError'
import { GENERIC_CODES, HTTP_CODES } from '../../../../../commons/libs/constants/GenericCodes'
import type { GetChatHistoryEvent } from '../../../../application/chatWorkflow/Types'
import type { HttpLoggerAttributes } from '../../commons/logger/HttpLogger'
import type { ChatMessageDTO } from '../../../../../commons/dto/ChatDTO'

jest.mock('../../../../application/chatWorkflow/ChatMessageService')
jest.mock('../../../../application/chatWorkflow/ChatChannelService')
jest.mock('../../commons/logger/HttpLogger', () => ({
  createHTTPLogger: jest.fn(() => ({ info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() }))
}))

const mockMessage = ChatMessageService as jest.MockedClass<typeof ChatMessageService>

const event = (
  overrides: Partial<GetChatHistoryEvent> = {}
): GetChatHistoryEvent & HttpLoggerAttributes =>
  ({
    requesterId: 'seeker-1',
    channelId: 'req-1#donor-1',
    apiGwRequestId: 'api-req',
    cloudFrontRequestId: 'cf-req',
    ...overrides
  }) as GetChatHistoryEvent & HttpLoggerAttributes

const message: ChatMessageDTO = {
  channelId: 'req-1#donor-1',
  messageId: 'm1',
  clientMessageId: 'c1',
  senderId: 'seeker-1',
  body: 'hello',
  sentAt: '2026-06-26T00:00:00.000Z',
  ttl: 1
}

describe('chatGetHistory handler', () => {
  afterEach(() => jest.clearAllMocks())

  it('returns paginated history with an encoded nextCursor', async () => {
    mockMessage.prototype.getHistory.mockResolvedValue({ items: [message], nextCursor: { SK: 'MSG#x' } })

    const result = await chatGetHistory(event())
    const body = JSON.parse(result.body)

    expect(result.statusCode).toBe(HTTP_CODES.OK)
    expect(body.data.items).toHaveLength(1)
    expect(typeof body.data.nextCursor).toBe('string')
  })

  it('returns null nextCursor on the last page', async () => {
    mockMessage.prototype.getHistory.mockResolvedValue({ items: [message], nextCursor: undefined })

    const result = await chatGetHistory(event())
    const body = JSON.parse(result.body)

    expect(body.data.nextCursor).toBeNull()
  })

  it('maps a non-participant (403) error to a 403 response', async () => {
    mockMessage.prototype.getHistory.mockRejectedValue(chatForbidden())

    const result = await chatGetHistory(event())

    expect(result.statusCode).toBe(GENERIC_CODES.FORBIDDEN)
  })

  it('rejects a malformed cursor with 400 before querying', async () => {
    const result = await chatGetHistory(event({ cursor: Buffer.from('"oops"').toString('base64') }))

    expect(result.statusCode).toBe(GENERIC_CODES.BAD_REQUEST)
    expect(mockMessage.prototype.getHistory).not.toHaveBeenCalled()
  })
})
