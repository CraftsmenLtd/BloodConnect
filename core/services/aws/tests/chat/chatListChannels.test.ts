import chatListChannels from '../../chat/chatListChannels'
import { ChatChannelService } from '../../../../application/chatWorkflow/ChatChannelService'
import { GENERIC_CODES, HTTP_CODES } from '../../../../../commons/libs/constants/GenericCodes'
import type { GetChatChannelsEvent } from '../../../../application/chatWorkflow/Types'
import type { HttpLoggerAttributes } from '../../commons/logger/HttpLogger'
import type { ChannelMembershipDTO } from '../../../../../commons/dto/ChatDTO'

jest.mock('../../../../application/chatWorkflow/ChatChannelService')
jest.mock('../../commons/logger/HttpLogger', () => ({
  createHTTPLogger: jest.fn(() => ({ info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() }))
}))

const mockChannel = ChatChannelService as jest.MockedClass<typeof ChatChannelService>

const event = (overrides: Partial<GetChatChannelsEvent> = {}): GetChatChannelsEvent & HttpLoggerAttributes =>
  ({
    requesterId: 'seeker-1',
    apiGwRequestId: 'api',
    cloudFrontRequestId: 'cf',
    ...overrides
  }) as GetChatChannelsEvent & HttpLoggerAttributes

const membership: ChannelMembershipDTO = {
  userId: 'seeker-1',
  channelId: 'req-1#donor-1',
  otherParticipantId: 'donor-1',
  role: 'SEEKER',
  context: {
    requestedBloodGroup: 'O+',
    urgencyLevel: 'urgent',
    donationDateTime: '2026-07-01T10:00:00.000Z',
    location: 'Dhaka'
  },
  createdAt: '2026-06-26T00:00:00.000Z',
  ttl: 1
}

describe('chatListChannels handler', () => {
  afterEach(() => jest.clearAllMocks())

  it('returns the user channels with an encoded nextCursor', async () => {
    mockChannel.prototype.listChannelsForUser.mockResolvedValue({
      items: [membership],
      nextCursor: { GSI1SK: 'x' }
    })

    const result = await chatListChannels(event())
    const body = JSON.parse(result.body)

    expect(result.statusCode).toBe(HTTP_CODES.OK)
    expect(body.data.items).toHaveLength(1)
    expect(typeof body.data.nextCursor).toBe('string')
  })

  it('returns null nextCursor on the last page', async () => {
    mockChannel.prototype.listChannelsForUser.mockResolvedValue({ items: [], nextCursor: undefined })

    const result = await chatListChannels(event())
    const body = JSON.parse(result.body)

    expect(body.data.nextCursor).toBeNull()
  })

  it('rejects a malformed cursor with 400 before querying', async () => {
    const result = await chatListChannels(event({ cursor: Buffer.from('"oops"').toString('base64') }))

    expect(result.statusCode).toBe(GENERIC_CODES.BAD_REQUEST)
    expect(mockChannel.prototype.listChannelsForUser).not.toHaveBeenCalled()
  })
})
