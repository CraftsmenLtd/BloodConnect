import {
  ChatService,
  CHAT_RATE_LIMIT,
  CHAT_RATE_WINDOW_SECONDS
} from '../../chatWorkflow/ChatService'
import {
  ChatChannelStatus,
  ChatRole,
  buildChannelId
} from '../../../../commons/dto/ChatDTO'
import type {
  ChatChannelDTO,
  ChatContextSnapshot,
  ChatMembershipDTO
} from '../../../../commons/dto/ChatDTO'
import ChannelLockedError from '../../chatWorkflow/ChannelLockedError'
import NotChannelParticipantError from '../../chatWorkflow/NotChannelParticipantError'
import ChatRateLimitedError from '../../chatWorkflow/ChatRateLimitedError'
import { generateUniqueID } from '../../utils/idGenerator'
import { mockLogger } from '../mocks/mockLogger'

jest.mock('../../utils/idGenerator', () => ({
  generateUniqueID: jest.fn()
}))

const SEEKER_ID = 'seeker-1'
const REQUEST_POST_ID = 'req-1'
const DONOR_ID = 'donor-1'
const CHANNEL_ID = buildChannelId(SEEKER_ID, REQUEST_POST_ID, DONOR_ID)

const context: ChatContextSnapshot = {
  requestedBloodGroup: 'O+',
  urgencyLevel: 'urgent',
  donationDateTime: '2026-06-30T10:00:00.000Z',
  location: 'Dhaka'
}

const openChannelDto: ChatChannelDTO = {
  channelId: CHANNEL_ID,
  seekerId: SEEKER_ID,
  requestPostId: REQUEST_POST_ID,
  donorId: DONOR_ID,
  status: ChatChannelStatus.OPEN,
  context,
  createdAt: '2026-06-26T00:00:00.000Z'
}

describe('ChatService', () => {
  const chatRepository = {
    upsertChannelOpen: jest.fn(),
    lockChannel: jest.fn(),
    listChannelsForRequest: jest.fn(),
    getChannel: jest.fn(),
    updateChannelLastMessage: jest.fn(),
    upsertMembership: jest.fn(),
    listMembershipsByUser: jest.fn(),
    updateLastRead: jest.fn(),
    updateMembershipLastMessage: jest.fn(),
    putMessage: jest.fn(),
    queryMessages: jest.fn()
  }

  const chatRateLimitRepository = {
    tryConsume: jest.fn()
  }

  const chatService = new ChatService(chatRepository, chatRateLimitRepository, mockLogger)

  beforeEach(() => {
    jest.clearAllMocks();
    (generateUniqueID as jest.Mock).mockReturnValue('msg-ulid-1')
    chatRepository.upsertChannelOpen.mockResolvedValue(openChannelDto)
    chatRepository.upsertMembership.mockImplementation(async(m) => m)
    chatRepository.putMessage.mockImplementation(async(m) => m)
    chatRateLimitRepository.tryConsume.mockResolvedValue(true)
  })

  describe('openChannel', () => {
    test('opens the channel and upserts both participants\' memberships with the snapshot', async() => {
      await chatService.openChannel({
        seekerId: SEEKER_ID,
        requestPostId: REQUEST_POST_ID,
        donorId: DONOR_ID,
        context
      })

      expect(chatRepository.upsertChannelOpen).toHaveBeenCalledWith(
        expect.objectContaining({
          channelId: CHANNEL_ID,
          status: ChatChannelStatus.OPEN,
          context
        })
      )
      expect(chatRepository.upsertMembership).toHaveBeenCalledTimes(2)
      expect(chatRepository.upsertMembership).toHaveBeenCalledWith(
        expect.objectContaining({ userId: SEEKER_ID, channelId: CHANNEL_ID, role: ChatRole.SEEKER })
      )
      expect(chatRepository.upsertMembership).toHaveBeenCalledWith(
        expect.objectContaining({ userId: DONOR_ID, channelId: CHANNEL_ID, role: ChatRole.DONOR })
      )
    })

    test('reopen reuses the same upsert path (creator re-opens a locked channel on re-accept)', async() => {
      await chatService.openChannel({
        seekerId: SEEKER_ID,
        requestPostId: REQUEST_POST_ID,
        donorId: DONOR_ID,
        context
      })
      await chatService.openChannel({
        seekerId: SEEKER_ID,
        requestPostId: REQUEST_POST_ID,
        donorId: DONOR_ID,
        context
      })

      expect(chatRepository.upsertChannelOpen).toHaveBeenCalledTimes(2)
      expect(chatRepository.upsertMembership).toHaveBeenCalledTimes(4)
    })
  })

  describe('sendMessage', () => {
    test('persists the message and bumps lastMessageAt on the channel and both memberships', async() => {
      chatRepository.getChannel.mockResolvedValue(openChannelDto)

      const message = await chatService.sendMessage(CHANNEL_ID, SEEKER_ID, 'hello')

      expect(message.messageId).toBe('msg-ulid-1')
      expect(chatRepository.putMessage).toHaveBeenCalledWith(
        expect.objectContaining({ channelId: CHANNEL_ID, senderId: SEEKER_ID, content: 'hello' })
      )
      expect(chatRepository.updateChannelLastMessage).toHaveBeenCalledWith(
        SEEKER_ID,
        REQUEST_POST_ID,
        DONOR_ID,
        expect.any(String)
      )
      expect(chatRepository.updateMembershipLastMessage).toHaveBeenCalledWith(
        SEEKER_ID,
        CHANNEL_ID,
        expect.any(String)
      )
      expect(chatRepository.updateMembershipLastMessage).toHaveBeenCalledWith(
        DONOR_ID,
        CHANNEL_ID,
        expect.any(String)
      )
    })

    test('rejects a non-participant before touching the channel', async() => {
      await expect(
        chatService.sendMessage(CHANNEL_ID, 'intruder', 'hi')
      ).rejects.toBeInstanceOf(NotChannelParticipantError)

      expect(chatRepository.getChannel).not.toHaveBeenCalled()
      expect(chatRepository.putMessage).not.toHaveBeenCalled()
    })

    test('rejects sending to a LOCKED channel', async() => {
      chatRepository.getChannel.mockResolvedValue({
        ...openChannelDto,
        status: ChatChannelStatus.LOCKED
      })

      await expect(
        chatService.sendMessage(CHANNEL_ID, DONOR_ID, 'hi')
      ).rejects.toBeInstanceOf(ChannelLockedError)

      expect(chatRepository.putMessage).not.toHaveBeenCalled()
    })

    test('rejects sending to a channel that does not exist', async() => {
      chatRepository.getChannel.mockResolvedValue(null)

      await expect(
        chatService.sendMessage(CHANNEL_ID, DONOR_ID, 'hi')
      ).rejects.toBeInstanceOf(ChannelLockedError)
    })

    test('rejects the message when the rate limiter denies it', async() => {
      chatRepository.getChannel.mockResolvedValue(openChannelDto)
      chatRateLimitRepository.tryConsume.mockResolvedValue(false)

      await expect(
        chatService.sendMessage(CHANNEL_ID, SEEKER_ID, 'hi')
      ).rejects.toBeInstanceOf(ChatRateLimitedError)

      expect(chatRateLimitRepository.tryConsume).toHaveBeenCalledWith(
        CHANNEL_ID,
        CHAT_RATE_LIMIT,
        CHAT_RATE_WINDOW_SECONDS
      )
      expect(chatRepository.putMessage).not.toHaveBeenCalled()
    })
  })

  describe('listChannels', () => {
    test('returns the caller\'s memberships whether they act as seeker or donor', async() => {
      const asSeeker: ChatMembershipDTO = {
        userId: 'user-x',
        channelId: buildChannelId('user-x', 'req-a', 'donor-9'),
        role: ChatRole.SEEKER,
        lastReadAt: '2026-06-26T01:00:00.000Z',
        lastMessageAt: '2026-06-26T02:00:00.000Z',
        createdAt: '2026-06-26T00:00:00.000Z'
      }
      const asDonor: ChatMembershipDTO = {
        userId: 'user-x',
        channelId: buildChannelId('seeker-9', 'req-b', 'user-x'),
        role: ChatRole.DONOR,
        createdAt: '2026-06-26T00:00:00.000Z'
      }
      chatRepository.listMembershipsByUser.mockResolvedValue([asSeeker, asDonor])

      const channels = await chatService.listChannels('user-x')

      expect(chatRepository.listMembershipsByUser).toHaveBeenCalledWith('user-x')
      expect(channels.map((c) => c.role)).toEqual([ChatRole.SEEKER, ChatRole.DONOR])
    })
  })

  describe('markRead', () => {
    test('updates only the caller\'s membership marker', async() => {
      await chatService.markRead(DONOR_ID, CHANNEL_ID)

      expect(chatRepository.updateLastRead).toHaveBeenCalledTimes(1)
      expect(chatRepository.updateLastRead).toHaveBeenCalledWith(
        DONOR_ID,
        CHANNEL_ID,
        expect.any(String)
      )
    })
  })

  describe('getHistory', () => {
    test('passes the limit and cursor through and returns the newest-first page with the channel context', async() => {
      const page = {
        items: [
          { channelId: CHANNEL_ID, messageId: 'm2', senderId: SEEKER_ID, content: 'b', createdAt: '2026-06-26T00:00:02.000Z' },
          { channelId: CHANNEL_ID, messageId: 'm1', senderId: DONOR_ID, content: 'a', createdAt: '2026-06-26T00:00:01.000Z' }
        ],
        lastEvaluatedKey: { PK: 'CHATMSG#x', SK: 'm1' }
      }
      chatRepository.queryMessages.mockResolvedValue(page)
      chatRepository.getChannel.mockResolvedValue(openChannelDto)

      const cursor = { PK: 'CHATMSG#x', SK: 'm3' }
      const result = await chatService.getHistory(CHANNEL_ID, 25, cursor)

      expect(chatRepository.queryMessages).toHaveBeenCalledWith(CHANNEL_ID, 25, cursor)
      expect(chatRepository.getChannel).toHaveBeenCalledWith(SEEKER_ID, REQUEST_POST_ID, DONOR_ID)
      expect(result.page.items[0].messageId).toBe('m2')
      expect(result.page.lastEvaluatedKey).toEqual({ PK: 'CHATMSG#x', SK: 'm1' })
      expect(result.channel).toEqual({ status: ChatChannelStatus.OPEN, context })
    })

    test('returns a null channel when the channel no longer exists', async() => {
      chatRepository.queryMessages.mockResolvedValue({ items: [] })
      chatRepository.getChannel.mockResolvedValue(null)

      const result = await chatService.getHistory(CHANNEL_ID)

      expect(result.channel).toBeNull()
      expect(result.page.items).toEqual([])
    })
  })

  describe('lockChannel', () => {
    test('locks a single channel by its participants', async() => {
      await chatService.lockChannel(SEEKER_ID, REQUEST_POST_ID, DONOR_ID)

      expect(chatRepository.lockChannel).toHaveBeenCalledWith(SEEKER_ID, REQUEST_POST_ID, DONOR_ID)
    })
  })

  describe('lockChannelsForRequest', () => {
    test('locks every channel of a request', async() => {
      chatRepository.listChannelsForRequest.mockResolvedValue([
        { ...openChannelDto, donorId: 'donor-1' },
        { ...openChannelDto, donorId: 'donor-2' }
      ])

      await chatService.lockChannelsForRequest(SEEKER_ID, REQUEST_POST_ID)

      expect(chatRepository.lockChannel).toHaveBeenCalledTimes(2)
      expect(chatRepository.lockChannel).toHaveBeenCalledWith(SEEKER_ID, REQUEST_POST_ID, 'donor-1')
      expect(chatRepository.lockChannel).toHaveBeenCalledWith(SEEKER_ID, REQUEST_POST_ID, 'donor-2')
    })
  })
})
