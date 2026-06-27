import { ChatChannelService } from '../../chatWorkflow/ChatChannelService'
import type { ChatChannelOps } from '../../chatWorkflow/ChatChannelService'
import { NotParticipantError } from '../../chatWorkflow/ChatErrors'
import type { ChatChannelDTO } from '../../../../commons/dto/ChatDTO'

const channelId = 'seeker1#req1#donor1'

const buildChannel = (overrides: Partial<ChatChannelDTO> = {}): ChatChannelDTO => ({
  channelId,
  seekerId: 'seeker1',
  donorId: 'donor1',
  requestPostId: 'req1',
  status: 'ACTIVE',
  createdAt: '2026-06-26T00:00:00.000Z',
  ...overrides
})

describe('ChatChannelService', () => {
  const channelOps = {
    createChannel: jest.fn(),
    getChannel: jest.fn(),
    listChannelsForUser: jest.fn(),
    listChannelsForRequest: jest.fn(),
    lockChannel: jest.fn(),
    incrementUnread: jest.fn(),
    resetUnread: jest.fn()
  } as unknown as jest.Mocked<ChatChannelOps>

  const service = new ChatChannelService(channelOps)

  beforeEach(() => {
    jest.resetAllMocks()
  })

  describe('ensureChannel', () => {
    it('is idempotent: returns the existing channel without creating a second one', async () => {
      const existing = buildChannel()
      channelOps.getChannel.mockResolvedValue(existing)

      const result = await service.ensureChannel('seeker1', 'req1', 'donor1')

      expect(result).toBe(existing)
      expect(channelOps.createChannel).not.toHaveBeenCalled()
    })

    it('creates the channel when it does not yet exist', async () => {
      channelOps.getChannel.mockResolvedValue(null)
      channelOps.createChannel.mockImplementation((channel) => Promise.resolve(channel))

      await service.ensureChannel('seeker1', 'req1', 'donor1', '2026-06-26T00:00:00.000Z')

      expect(channelOps.createChannel).toHaveBeenCalledWith(
        expect.objectContaining({
          channelId,
          seekerId: 'seeker1',
          donorId: 'donor1',
          requestPostId: 'req1',
          status: 'ACTIVE'
        })
      )
    })
  })

  describe('lockChannelsForRequest', () => {
    it('locks every channel derived from the request pointers', async () => {
      channelOps.listChannelsForRequest.mockResolvedValue([
        { SK: 'CHAT#seeker1#req1#donor1' },
        { SK: 'CHAT#seeker1#req1#donor2' }
      ])

      await service.lockChannelsForRequest('seeker1', 'req1')

      expect(channelOps.lockChannel).toHaveBeenCalledWith('seeker1#req1#donor1')
      expect(channelOps.lockChannel).toHaveBeenCalledWith('seeker1#req1#donor2')
    })
  })

  describe('listInbox', () => {
    it('maps inbox pointers to channel entries', async () => {
      channelOps.listChannelsForUser.mockResolvedValue([
        { SK: 'CHAT#seeker1#req1#donor1', lastMessagePreview: 'hi', unreadCount: 2 }
      ])

      const inbox = await service.listInbox('seeker1')

      expect(inbox).toEqual([
        { channelId, lastMessagePreview: 'hi', unreadCount: 2 }
      ])
    })
  })

  describe('assertParticipant', () => {
    it('accepts a participant derived from the channel id', () => {
      expect(() => service.assertParticipant(channelId, 'donor1')).not.toThrow()
    })

    it('rejects a non-participant', () => {
      expect(() => service.assertParticipant(channelId, 'intruder')).toThrow(NotParticipantError)
    })
  })
})
