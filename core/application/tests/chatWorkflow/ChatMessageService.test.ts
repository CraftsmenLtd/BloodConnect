import { ChatMessageService } from '../../chatWorkflow/ChatMessageService'
import type { ChatMessageOps } from '../../chatWorkflow/ChatMessageService'
import type { ChatChannelOps } from '../../chatWorkflow/ChatChannelService'
import {
  ChannelLockedError,
  ChatMessageValidationError,
  NotParticipantError,
  RateLimitError
} from '../../chatWorkflow/ChatErrors'
import { CHAT_RATE_LIMIT_PER_MINUTE } from '../../../../commons/libs/constants/NoMagicNumbers'
import type { ChatChannelDTO } from '../../../../commons/dto/ChatDTO'

const channelId = 'seeker1#req1#donor1'
const sender = 'seeker1'
const recipient = 'donor1'
const messageId = 'msg1'
const text = 'need O+ blood urgently'

const nowIso = (): string => new Date().toISOString()

const buildChannel = (status: ChatChannelDTO['status']): ChatChannelDTO => ({
  channelId,
  seekerId: 'seeker1',
  donorId: 'donor1',
  requestPostId: 'req1',
  status,
  createdAt: '2026-06-26T00:00:00.000Z'
})

describe('ChatMessageService', () => {
  const messageOps = {
    addMessage: jest.fn(),
    getHistory: jest.fn(),
    countMessagesSince: jest.fn()
  } as unknown as jest.Mocked<ChatMessageOps>

  const channelOps = {
    createChannel: jest.fn(),
    getChannel: jest.fn(),
    listChannelsForUser: jest.fn(),
    listChannelsForRequest: jest.fn(),
    lockChannel: jest.fn(),
    incrementUnread: jest.fn(),
    resetUnread: jest.fn()
  } as unknown as jest.Mocked<ChatChannelOps>

  const service = new ChatMessageService(messageOps, channelOps)

  beforeEach(() => {
    jest.resetAllMocks()
    messageOps.countMessagesSince.mockResolvedValue(0)
    messageOps.addMessage.mockImplementation((message) => Promise.resolve(message))
  })

  describe('participant authorization', () => {
    it('rejects sendMessage from a non-participant', async () => {
      await expect(
        service.sendMessage(channelId, 'intruder', text, nowIso(), messageId)
      ).rejects.toBeInstanceOf(NotParticipantError)
      expect(messageOps.addMessage).not.toHaveBeenCalled()
    })

    it('rejects getHistory for a non-participant', async () => {
      await expect(
        service.getHistory(channelId, 'intruder')
      ).rejects.toBeInstanceOf(NotParticipantError)
      expect(messageOps.getHistory).not.toHaveBeenCalled()
    })
  })

  describe('clock-drift validation', () => {
    it('rejects a clientCreatedAt outside the +-5 minute window', async () => {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()

      await expect(
        service.sendMessage(channelId, sender, text, tenMinutesAgo, messageId)
      ).rejects.toBeInstanceOf(ChatMessageValidationError)
      expect(messageOps.addMessage).not.toHaveBeenCalled()
    })
  })

  describe('rate limiting', () => {
    it('allows the message when the window holds fewer than the limit', async () => {
      messageOps.countMessagesSince.mockResolvedValue(CHAT_RATE_LIMIT_PER_MINUTE - 1)

      await service.sendMessage(channelId, sender, text, nowIso(), messageId)

      expect(messageOps.addMessage).toHaveBeenCalledTimes(1)
    })

    it('rejects once the window is at the limit', async () => {
      messageOps.countMessagesSince.mockResolvedValue(CHAT_RATE_LIMIT_PER_MINUTE)

      await expect(
        service.sendMessage(channelId, sender, text, nowIso(), messageId)
      ).rejects.toBeInstanceOf(RateLimitError)
      expect(messageOps.addMessage).not.toHaveBeenCalled()
    })
  })

  describe('locked channel', () => {
    it('rejects when the conditional write fails and the channel is locked', async () => {
      messageOps.addMessage.mockRejectedValue(new Error('transaction cancelled'))
      channelOps.getChannel.mockResolvedValue(buildChannel('LOCKED'))

      await expect(
        service.sendMessage(channelId, sender, text, nowIso(), messageId)
      ).rejects.toBeInstanceOf(ChannelLockedError)
      expect(channelOps.incrementUnread).not.toHaveBeenCalled()
    })

    it('treats a write failure on a still-active channel as an idempotent dedupe', async () => {
      messageOps.addMessage.mockRejectedValue(new Error('duplicate'))
      channelOps.getChannel.mockResolvedValue(buildChannel('ACTIVE'))

      await service.sendMessage(channelId, sender, text, nowIso(), messageId)

      expect(channelOps.incrementUnread).not.toHaveBeenCalled()
    })
  })

  describe('unread tracking', () => {
    it('increments the recipient unread count on a successful send', async () => {
      await service.sendMessage(channelId, sender, text, nowIso(), messageId)

      expect(channelOps.incrementUnread).toHaveBeenCalledWith(recipient, channelId, text)
    })

    it('resets the unread count on markRead', async () => {
      await service.markRead(channelId, recipient)

      expect(channelOps.resetUnread).toHaveBeenCalledWith(recipient, channelId)
    })
  })
})
