import { ChatService } from '../../chatWorkflow/ChatService'
import ChatOperationError from '../../chatWorkflow/ChatOperationError'
import { GENERIC_CODES } from '../../../../commons/libs/constants/GenericCodes'
import { buildChannelId } from '../../utils/chatChannel'
import { mockLogger } from '../mocks/mockLogger'
import type { ChatChannelDTO } from '../../../../commons/dto/ChatDTO'

describe('ChatService', () => {
  const seekerId = 'seeker-1'
  const donorId = 'donor-1'
  const requestPostId = 'request-1'
  const channelId = buildChannelId(seekerId, requestPostId, donorId)

  const channel: ChatChannelDTO = {
    channelId,
    seekerId,
    requestPostId,
    donorId,
    locked: false,
    createdAt: '2024-01-01T00:00:00Z'
  }

  const chatChannelRepository = {
    create: jest.fn(),
    update: jest.fn(),
    getItem: jest.fn(),
    query: jest.fn(),
    delete: jest.fn(),
    getChannel: jest.fn()
  }
  const chatMessageRepository = {
    create: jest.fn(),
    update: jest.fn(),
    getItem: jest.fn(),
    query: jest.fn(),
    delete: jest.fn(),
    getChannelMessages: jest.fn()
  }
  const userChannelRepository = {
    create: jest.fn(),
    update: jest.fn(),
    getItem: jest.fn(),
    query: jest.fn(),
    delete: jest.fn(),
    getUserChannel: jest.fn(),
    getUserChannels: jest.fn()
  }

  const service = new ChatService(
    chatChannelRepository,
    chatMessageRepository,
    userChannelRepository,
    mockLogger
  )

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createChannel', () => {
    it('is idempotent and returns the existing channel without creating', async () => {
      chatChannelRepository.getChannel.mockResolvedValue(channel)

      const result = await service.createChannel({ seekerId, requestPostId, donorId })

      expect(result).toEqual(channel)
      expect(chatChannelRepository.create).not.toHaveBeenCalled()
      expect(userChannelRepository.create).not.toHaveBeenCalled()
    })

    it('creates the channel and a user-channel row for both participants', async () => {
      chatChannelRepository.getChannel.mockResolvedValue(null)
      chatChannelRepository.create.mockImplementation(async (item) => item)
      userChannelRepository.create.mockResolvedValue(undefined)

      const result = await service.createChannel({ seekerId, requestPostId, donorId })

      expect(result.channelId).toBe(channelId)
      expect(chatChannelRepository.create).toHaveBeenCalledTimes(1)
      expect(userChannelRepository.create).toHaveBeenCalledTimes(2)
    })
  })

  describe('sendMessage', () => {
    it('rejects empty content with a bad request error', async () => {
      await expect(
        service.sendMessage({ channelId, senderId: seekerId, content: '   ' })
      ).rejects.toMatchObject({ errorCode: GENERIC_CODES.BAD_REQUEST })
      expect(chatChannelRepository.getChannel).not.toHaveBeenCalled()
    })

    it('rejects a non-participant sender as unauthorized', async () => {
      chatChannelRepository.getChannel.mockResolvedValue(channel)

      await expect(
        service.sendMessage({ channelId, senderId: 'stranger', content: 'hi' })
      ).rejects.toMatchObject({ errorCode: GENERIC_CODES.UNAUTHORIZED })
    })

    it('rejects sending to a locked channel', async () => {
      chatChannelRepository.getChannel.mockResolvedValue({ ...channel, locked: true })

      await expect(
        service.sendMessage({ channelId, senderId: seekerId, content: 'hi' })
      ).rejects.toMatchObject({ errorCode: GENERIC_CODES.BAD_REQUEST })
    })

    it('persists the message and returns the recipient', async () => {
      chatChannelRepository.getChannel.mockResolvedValue(channel)
      chatMessageRepository.create.mockImplementation(async (item) => item)
      chatChannelRepository.update.mockResolvedValue(undefined)
      userChannelRepository.getUserChannel.mockResolvedValue(null)
      userChannelRepository.create.mockResolvedValue(undefined)

      const result = await service.sendMessage({
        channelId,
        senderId: seekerId,
        content: 'hello'
      })

      expect(result.recipientId).toBe(donorId)
      expect(result.message.content).toBe('hello')
      expect(chatMessageRepository.create).toHaveBeenCalledTimes(1)
      expect(chatChannelRepository.update).toHaveBeenCalledTimes(1)
    })
  })

  describe('lockChannel', () => {
    it('does nothing when the channel is already locked', async () => {
      chatChannelRepository.getChannel.mockResolvedValue({ ...channel, locked: true })

      await service.lockChannel(channelId)

      expect(chatChannelRepository.update).not.toHaveBeenCalled()
    })

    it('locks an unlocked channel', async () => {
      chatChannelRepository.getChannel.mockResolvedValue(channel)
      chatChannelRepository.update.mockResolvedValue(undefined)

      await service.lockChannel(channelId)

      expect(chatChannelRepository.update).toHaveBeenCalledWith({ channelId, locked: true })
    })
  })

  describe('getHistory', () => {
    it('enforces channel participation', async () => {
      chatChannelRepository.getChannel.mockResolvedValue(channel)

      await expect(service.getHistory(channelId, 'stranger')).rejects.toBeInstanceOf(
        ChatOperationError
      )
      expect(chatMessageRepository.getChannelMessages).not.toHaveBeenCalled()
    })

    it('returns messages for a participant', async () => {
      chatChannelRepository.getChannel.mockResolvedValue(channel)
      chatMessageRepository.getChannelMessages.mockResolvedValue({ items: [] })

      const result = await service.getHistory(channelId, seekerId)

      expect(result.items).toEqual([])
      expect(chatMessageRepository.getChannelMessages).toHaveBeenCalled()
    })
  })

  describe('getInbox', () => {
    it('delegates to the user-channel repository', async () => {
      userChannelRepository.getUserChannels.mockResolvedValue({ items: [] })

      const result = await service.getInbox(seekerId)

      expect(result.items).toEqual([])
      expect(userChannelRepository.getUserChannels).toHaveBeenCalledWith(
        seekerId,
        expect.any(Number),
        undefined
      )
    })
  })
})
