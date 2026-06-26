import {
  buildChannelId,
  parseChannelId,
  ChatChannelStatus,
  ChatRole
} from '../../../commons/dto/ChatDTO'
import type {
  ChatChannelDTO,
  ChatContextSnapshot,
  ChatMembershipDTO,
  ChatMessageDTO
} from '../../../commons/dto/ChatDTO'
import { GENERIC_CODES } from '../../../commons/libs/constants/GenericCodes'
import type ChatRepository from '../models/policies/repositories/ChatRepository'
import type { ChatHistoryPage } from '../models/policies/repositories/ChatRepository'
import type ChatRateLimitRepository from '../models/policies/repositories/ChatRateLimitRepository'
import type { Logger } from '../models/logger/Logger'
import { generateUniqueID } from '../utils/idGenerator'
import ChannelLockedError from './ChannelLockedError'
import NotChannelParticipantError from './NotChannelParticipantError'
import ChatRateLimitedError from './ChatRateLimitedError'

// 60 messages per channel per rolling 60-second window.
export const CHAT_RATE_LIMIT = 60
export const CHAT_RATE_WINDOW_SECONDS = 60

export type OpenChannelAttributes = {
  seekerId: string;
  requestPostId: string;
  donorId: string;
  context: ChatContextSnapshot;
}

export class ChatService {
  constructor(
    protected readonly chatRepository: ChatRepository,
    protected readonly chatRateLimitRepository: ChatRateLimitRepository,
    protected readonly logger: Logger
  ) {}

  // Create-or-reopen the channel and upsert both participants' membership items, snapshotting the
  // request context so the chat header renders on a cold-start deep-link without a post fetch.
  async openChannel(attributes: OpenChannelAttributes): Promise<ChatChannelDTO> {
    const { seekerId, requestPostId, donorId, context } = attributes
    const channelId = buildChannelId(seekerId, requestPostId, donorId)
    const now = new Date().toISOString()

    const channel = await this.chatRepository.upsertChannelOpen({
      channelId,
      seekerId,
      requestPostId,
      donorId,
      status: ChatChannelStatus.OPEN,
      context,
      createdAt: now
    })

    await this.chatRepository.upsertMembership({
      userId: seekerId,
      channelId,
      role: ChatRole.SEEKER,
      createdAt: now
    })
    await this.chatRepository.upsertMembership({
      userId: donorId,
      channelId,
      role: ChatRole.DONOR,
      createdAt: now
    })

    return channel
  }

  // Reject non-participants and non-open channels, enforce the rate limit, persist the message and
  // bump lastMessageAt on the channel and both membership items.
  async sendMessage(
    channelId: string,
    senderId: string,
    content: string
  ): Promise<ChatMessageDTO> {
    const { seekerId, requestPostId, donorId } = parseChannelId(channelId)
    if (senderId !== seekerId && senderId !== donorId) {
      throw new NotChannelParticipantError(
        'Sender is not a participant of this channel.',
        GENERIC_CODES.UNAUTHORIZED
      )
    }

    const channel = await this.chatRepository.getChannel(seekerId, requestPostId, donorId)
    if (channel === null || channel.status !== ChatChannelStatus.OPEN) {
      throw new ChannelLockedError(
        'Channel is not open for messaging.',
        GENERIC_CODES.BAD_REQUEST
      )
    }

    const allowed = await this.chatRateLimitRepository.tryConsume(
      channelId,
      CHAT_RATE_LIMIT,
      CHAT_RATE_WINDOW_SECONDS
    )
    if (!allowed) {
      throw new ChatRateLimitedError(
        'Message rate limit exceeded for this channel.',
        GENERIC_CODES.TOO_MANY_REQUESTS
      )
    }

    const now = new Date().toISOString()
    const savedMessage = await this.chatRepository.putMessage({
      channelId,
      messageId: generateUniqueID(),
      senderId,
      content,
      createdAt: now
    })

    await this.chatRepository.updateChannelLastMessage(seekerId, requestPostId, donorId, now)
    await this.chatRepository.updateMembershipLastMessage(seekerId, channelId, now)
    await this.chatRepository.updateMembershipLastMessage(donorId, channelId, now)

    return savedMessage
  }

  // Lists the caller's channels via their membership items: each carries the denormalized
  // lastMessageAt and the caller's private lastReadAt, from which the client derives unread.
  async listChannels(userId: string): Promise<ChatMembershipDTO[]> {
    return this.chatRepository.listMembershipsByUser(userId)
  }

  async markRead(userId: string, channelId: string): Promise<void> {
    await this.chatRepository.updateLastRead(userId, channelId, new Date().toISOString())
  }

  // Newest-first paginated message history for a channel.
  async getHistory(
    channelId: string,
    limit?: number,
    exclusiveStartKey?: Record<string, unknown>
  ): Promise<ChatHistoryPage> {
    return this.chatRepository.queryMessages(channelId, limit, exclusiveStartKey)
  }

  async lockChannel(seekerId: string, requestPostId: string, donorId: string): Promise<void> {
    await this.chatRepository.lockChannel(seekerId, requestPostId, donorId)
  }

  // Locks every channel of a request (used by the cancel/expire in-service hooks where there is no
  // per-donor REMOVE event to drive the lock pipe).
  async lockChannelsForRequest(seekerId: string, requestPostId: string): Promise<void> {
    const channels = await this.chatRepository.listChannelsForRequest(seekerId, requestPostId)
    for (const channel of channels) {
      await this.chatRepository.lockChannel(
        channel.seekerId,
        channel.requestPostId,
        channel.donorId
      )
    }
  }
}
