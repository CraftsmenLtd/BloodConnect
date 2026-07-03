import type ChatMessageRepository from '../models/policies/repositories/ChatMessageRepository'
import type { Logger } from '../models/logger/Logger'
import type { ChatMessageDTO } from '../../../commons/dto/ChatDTO'
import { ChatChannelStatus, ChatRealtimeEventType } from '../../../commons/dto/ChatDTO'
import type { RealtimeNotifier, OfflineNotifier } from '../models/realtime/RealtimeNotifier'
import type { ChatChannelService } from './ChatChannelService'
import type { ChatConnectionService } from './ChatConnectionService'
import type { SendMessageInput, Paginated } from './Types'
import {
  CHANNEL_TTL_SECONDS,
  EPOCH_ISO,
  HISTORY_PAGE_SIZE,
  RATE_LIMIT_PER_MINUTE,
  RATE_LIMIT_TTL_SECONDS,
  messagePreview,
  ttlFromNow
} from './Types'
import { chatConflict, chatNotFound, chatTooManyRequests } from './ChatOperationError'
import { validateBody, validateChannelId, validateIds } from './validation'
import { generateUniqueID } from '../utils/idGenerator'

export class ChatMessageService {
  constructor(
    protected readonly chatMessageRepository: ChatMessageRepository,
    protected readonly logger: Logger
  ) {}

  async sendMessage(
    input: SendMessageInput,
    channelService: ChatChannelService,
    connectionService: ChatConnectionService,
    realtime: RealtimeNotifier,
    offlineNotifier: OfflineNotifier
  ): Promise<ChatMessageDTO> {
    validateChannelId(input.channelId)
    validateIds({
      senderId: input.senderId,
      clientMessageId: input.clientMessageId
    })
    const body = validateBody(input.body)

    const channel = await channelService.getChannel(input.channelId)
    if (channel === null) {
      throw chatNotFound()
    }
    channelService.assertParticipant(channel, input.senderId)
    if (channel.status !== ChatChannelStatus.OPEN) {
      throw chatConflict()
    }
    await this.assertWithinRateLimit(input.channelId, input.senderId)

    const nowMs = Date.now()
    const message: ChatMessageDTO = {
      channelId: input.channelId,
      messageId: generateUniqueID(),
      clientMessageId: input.clientMessageId,
      senderId: input.senderId,
      body,
      sentAt: new Date(nowMs).toISOString(),
      ttl: ttlFromNow(nowMs, CHANNEL_TTL_SECONDS)
    }

    const { created, message: persisted }
      = await this.chatMessageRepository.createMessageIdempotent(message)
    if (!created) {
      this.logger.info('duplicate message ignored', { channelId: input.channelId })

      return persisted
    }

    await channelService.recordLastMessage(channel, messagePreview(body), persisted.sentAt)

    const recipientId = channelService.otherParticipant(channel, input.senderId)
    const recipientConnections = await connectionService.getConnectionsForUser(recipientId)
    const senderConnections = await connectionService.getConnectionsForUser(input.senderId)
    const targetConnections = [...recipientConnections, ...senderConnections]

    if (targetConnections.length > 0) {
      const { staleConnectionIds } = await realtime.postToConnections(targetConnections, {
        type: ChatRealtimeEventType.MESSAGE,
        channelId: input.channelId,
        message: persisted
      })
      await this.cleanupStaleConnections(staleConnectionIds, connectionService)
    }

    if (recipientConnections.length === 0) {
      await offlineNotifier.notifyNewMessage(recipientId, channel, persisted)
    }

    return persisted
  }

  async getHistory(
    channelId: string,
    requesterId: string,
    channelService: ChatChannelService,
    limit: number = HISTORY_PAGE_SIZE,
    cursor?: Record<string, unknown>
  ): Promise<Paginated<ChatMessageDTO>> {
    validateChannelId(channelId)
    validateIds({ requesterId })
    const channel = await channelService.getChannel(channelId)
    if (channel === null) {
      throw chatNotFound()
    }
    channelService.assertParticipant(channel, requesterId)

    const { items, lastEvaluatedKey } = await this.chatMessageRepository.queryByChannel(
      channelId,
      limit,
      cursor
    )

    return { items, nextCursor: lastEvaluatedKey }
  }

  async markRead(
    channelId: string,
    userId: string,
    channelService: ChatChannelService,
    connectionService: ChatConnectionService,
    realtime: RealtimeNotifier
  ): Promise<void> {
    validateChannelId(channelId)
    validateIds({ userId })
    const channel = await channelService.getChannel(channelId)
    if (channel === null) {
      throw chatNotFound()
    }
    channelService.assertParticipant(channel, userId)

    const readAt = new Date().toISOString()
    await channelService.updateLastReadAt(userId, channelId, readAt)

    const otherId = channelService.otherParticipant(channel, userId)
    const connections = await connectionService.getConnectionsForUser(otherId)
    if (connections.length > 0) {
      const { staleConnectionIds } = await realtime.postToConnections(connections, {
        type: ChatRealtimeEventType.READ_RECEIPT,
        channelId,
        userId,
        readAt
      })
      await this.cleanupStaleConnections(staleConnectionIds, connectionService)
    }
  }

  async getUnreadCount(
    channelId: string,
    userId: string,
    channelService: ChatChannelService
  ): Promise<number> {
    const membership = await channelService.getMembership(userId, channelId)
    const since = membership?.lastReadAt ?? EPOCH_ISO

    return this.chatMessageRepository.countSince(channelId, since, userId)
  }

  async assertWithinRateLimit(channelId: string, senderId: string): Promise<void> {
    const nowMs = Date.now()
    const bucketMinute = new Date(nowMs).toISOString().slice(0, 16)
    const count = await this.chatMessageRepository.incrementRateCounter(
      channelId,
      senderId,
      bucketMinute,
      ttlFromNow(nowMs, RATE_LIMIT_TTL_SECONDS)
    )
    if (count > RATE_LIMIT_PER_MINUTE) {
      throw chatTooManyRequests()
    }
  }

  private async cleanupStaleConnections(
    staleConnectionIds: string[],
    connectionService: ChatConnectionService
  ): Promise<void> {
    await Promise.all(
      staleConnectionIds.map((connectionId) => connectionService.removeConnection(connectionId))
    )
  }
}
