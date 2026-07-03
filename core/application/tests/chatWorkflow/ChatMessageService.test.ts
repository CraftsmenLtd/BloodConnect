import fc from 'fast-check'
import { ChatMessageService } from '../../chatWorkflow/ChatMessageService'
import { ChatChannelService } from '../../chatWorkflow/ChatChannelService'
import { ChatConnectionService } from '../../chatWorkflow/ChatConnectionService'
import type ChatMessageRepository from '../../models/policies/repositories/ChatMessageRepository'
import type ChatChannelRepository from '../../models/policies/repositories/ChatChannelRepository'
import type ChatConnectionRepository from '../../models/policies/repositories/ChatConnectionRepository'
import type { RealtimeNotifier, OfflineNotifier } from '../../models/realtime/RealtimeNotifier'
import type { ChatChannelDTO, ChatMessageDTO } from '../../../../commons/dto/ChatDTO'
import { ChatChannelStatus } from '../../../../commons/dto/ChatDTO'
import { buildChannelId, RATE_LIMIT_PER_MINUTE } from '../../chatWorkflow/Types'
import ChatOperationError from '../../chatWorkflow/ChatOperationError'
import { GENERIC_CODES } from '../../../../commons/libs/constants/GenericCodes'
import { mockLogger } from '../mocks/mockLogger'

const CHANNEL_ID = buildChannelId('req-1', 'donor-1')

const messageRepository = (): jest.Mocked<ChatMessageRepository> => ({
  createMessageIdempotent: jest.fn(),
  queryByChannel: jest.fn(),
  countSince: jest.fn(),
  incrementRateCounter: jest.fn()
})

const channelRepository = (): jest.Mocked<ChatChannelRepository> => ({
  getChannel: jest.fn(),
  createChannelIfAbsent: jest.fn(),
  updateStatus: jest.fn(),
  updateLastMessageForMembers: jest.fn(),
  queryChannelsByUser: jest.fn(),
  getMembership: jest.fn(),
  updateLastReadAt: jest.fn()
})

const connectionRepository = (): jest.Mocked<ChatConnectionRepository> => ({
  saveConnection: jest.fn(),
  deleteConnection: jest.fn(),
  queryConnectionsByUser: jest.fn(),
  getConnection: jest.fn()
})

const openChannel = (overrides: Partial<ChatChannelDTO> = {}): ChatChannelDTO => ({
  channelId: CHANNEL_ID,
  seekerId: 'seeker-1',
  requestPostId: 'req-1',
  donorId: 'donor-1',
  status: ChatChannelStatus.OPEN,
  context: {
    requestedBloodGroup: 'O+',
    urgencyLevel: 'urgent',
    donationDateTime: '2026-07-01T10:00:00.000Z',
    location: 'Dhaka'
  },
  createdAt: '2026-06-26T00:00:00.000Z',
  ttl: 1893456000,
  ...overrides
})

describe('ChatMessageService', () => {
  let messageRepo: jest.Mocked<ChatMessageRepository>
  let channelRepo: jest.Mocked<ChatChannelRepository>
  let connRepo: jest.Mocked<ChatConnectionRepository>
  let channelService: ChatChannelService
  let connectionService: ChatConnectionService
  let service: ChatMessageService
  let realtime: jest.Mocked<RealtimeNotifier>
  let offlineNotifier: jest.Mocked<OfflineNotifier>

  const validInput = {
    channelId: CHANNEL_ID,
    senderId: 'seeker-1',
    body: 'hello donor',
    clientMessageId: 'client-1'
  }

  beforeEach(() => {
    messageRepo = messageRepository()
    channelRepo = channelRepository()
    connRepo = connectionRepository()
    channelService = new ChatChannelService(channelRepo, mockLogger)
    connectionService = new ChatConnectionService(connRepo, mockLogger)
    service = new ChatMessageService(messageRepo, mockLogger)
    realtime = { postToConnections: jest.fn().mockResolvedValue({ staleConnectionIds: [] }) }
    offlineNotifier = { notifyNewMessage: jest.fn() }
    messageRepo.incrementRateCounter.mockResolvedValue(1)
    messageRepo.createMessageIdempotent.mockImplementation(async (message: ChatMessageDTO) => ({
      created: true,
      message
    }))
    connRepo.queryConnectionsByUser.mockResolvedValue([])
  })

  const send = (): Promise<ChatMessageDTO> =>
    service.sendMessage(validInput, channelService, connectionService, realtime, offlineNotifier)

  it('persists a message and pushes an offline notification when the recipient is not connected', async () => {
    channelRepo.getChannel.mockResolvedValue(openChannel())

    const message = await send()

    expect(message.body).toBe('hello donor')
    expect(channelRepo.updateLastMessageForMembers).toHaveBeenCalled()
    expect(offlineNotifier.notifyNewMessage).toHaveBeenCalledWith(
      'donor-1',
      expect.objectContaining({ channelId: CHANNEL_ID }),
      expect.objectContaining({ body: 'hello donor' })
    )
  })

  it('delivers in real time and skips push when the recipient is connected', async () => {
    channelRepo.getChannel.mockResolvedValue(openChannel())
    connRepo.queryConnectionsByUser.mockImplementation(async (userId: string) =>
      userId === 'donor-1'
        ? [{ connectionId: 'c-donor', userId, connectedAt: 'x', ttl: 1 }]
        : []
    )

    await send()

    expect(realtime.postToConnections).toHaveBeenCalled()
    expect(offlineNotifier.notifyNewMessage).not.toHaveBeenCalled()
  })

  it('rejects a message on a LOCKED channel (409)', async () => {
    channelRepo.getChannel.mockResolvedValue(openChannel({ status: ChatChannelStatus.LOCKED }))
    await expect(send()).rejects.toMatchObject({ errorCode: GENERIC_CODES.CONFLICT })
    expect(messageRepo.createMessageIdempotent).not.toHaveBeenCalled()
  })

  it('rejects a non-participant (403)', async () => {
    channelRepo.getChannel.mockResolvedValue(openChannel())
    await expect(
      service.sendMessage(
        { ...validInput, senderId: 'intruder' },
        channelService,
        connectionService,
        realtime,
        offlineNotifier
      )
    ).rejects.toMatchObject({ errorCode: GENERIC_CODES.FORBIDDEN })
  })

  it('rejects when the channel does not exist (404)', async () => {
    channelRepo.getChannel.mockResolvedValue(null)
    await expect(send()).rejects.toMatchObject({ errorCode: GENERIC_CODES.NOT_FOUND })
  })

  it('throttles when the per-minute rate limit is exceeded (429)', async () => {
    channelRepo.getChannel.mockResolvedValue(openChannel())
    messageRepo.incrementRateCounter.mockResolvedValue(RATE_LIMIT_PER_MINUTE + 1)
    await expect(send()).rejects.toMatchObject({ errorCode: GENERIC_CODES.TOO_MANY_REQUESTS })
  })

  it('is idempotent — a duplicate clientMessageId returns the existing message without re-broadcasting', async () => {
    channelRepo.getChannel.mockResolvedValue(openChannel())
    const existing: ChatMessageDTO = {
      channelId: CHANNEL_ID,
      messageId: 'm-existing',
      clientMessageId: 'client-1',
      senderId: 'seeker-1',
      body: 'hello donor',
      sentAt: '2026-06-26T00:00:01.000Z',
      ttl: 1893456000
    }
    messageRepo.createMessageIdempotent.mockResolvedValue({ created: false, message: existing })

    const result = await send()

    expect(result).toEqual(existing)
    expect(channelRepo.updateLastMessageForMembers).not.toHaveBeenCalled()
    expect(realtime.postToConnections).not.toHaveBeenCalled()
    expect(offlineNotifier.notifyNewMessage).not.toHaveBeenCalled()
  })

  it('rejects an over-long body before touching the repository (validation)', async () => {
    channelRepo.getChannel.mockResolvedValue(openChannel())
    await expect(
      service.sendMessage(
        { ...validInput, body: 'a'.repeat(2001) },
        channelService,
        connectionService,
        realtime,
        offlineNotifier
      )
    ).rejects.toBeInstanceOf(ChatOperationError)
    expect(messageRepo.createMessageIdempotent).not.toHaveBeenCalled()
  })

  describe('getHistory', () => {
    it('returns repository items (newest-first) for a participant', async () => {
      channelRepo.getChannel.mockResolvedValue(openChannel())
      messageRepo.queryByChannel.mockResolvedValue({ items: [], lastEvaluatedKey: undefined })
      const result = await service.getHistory(CHANNEL_ID, 'seeker-1', channelService)
      expect(result.items).toEqual([])
      expect(messageRepo.queryByChannel).toHaveBeenCalled()
    })

    it('forbids a non-participant (403)', async () => {
      channelRepo.getChannel.mockResolvedValue(openChannel())
      await expect(
        service.getHistory(CHANNEL_ID, 'intruder', channelService)
      ).rejects.toMatchObject({ errorCode: GENERIC_CODES.FORBIDDEN })
    })
  })

  describe('getUnreadCount (invariant: never negative)', () => {
    it('returns a non-negative count for any membership read state (PBT)', async () => {
      channelRepo.getChannel.mockResolvedValue(openChannel())
      await fc.assert(
        fc.asyncProperty(fc.nat({ max: 1000 }), async (count) => {
          messageRepo.countSince.mockResolvedValue(count)
          channelRepo.getMembership.mockResolvedValue(null)
          const result = await service.getUnreadCount(CHANNEL_ID, 'seeker-1', channelService)
          expect(result).toBeGreaterThanOrEqual(0)
          expect(result).toBe(count)
        })
      )
    })
  })

  describe('markRead', () => {
    it('updates lastReadAt and broadcasts a read receipt to the other participant', async () => {
      channelRepo.getChannel.mockResolvedValue(openChannel())
      channelRepo.getMembership.mockResolvedValue(null)
      connRepo.queryConnectionsByUser.mockResolvedValue([
        { connectionId: 'c-donor', userId: 'donor-1', connectedAt: 'x', ttl: 1 }
      ])

      await service.markRead(CHANNEL_ID, 'seeker-1', channelService, connectionService, realtime)

      expect(channelRepo.updateLastReadAt).toHaveBeenCalledWith(
        'seeker-1',
        CHANNEL_ID,
        expect.any(String)
      )
      expect(realtime.postToConnections).toHaveBeenCalled()
    })
  })
})
