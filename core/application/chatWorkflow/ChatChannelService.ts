import type ChatChannelRepository from '../models/policies/repositories/ChatChannelRepository'
import type { Logger } from '../models/logger/Logger'
import type {
  ChatChannelDTO,
  ChannelMembershipDTO,
  ChannelRole
} from '../../../commons/dto/ChatDTO'
import { ChatChannelStatus } from '../../../commons/dto/ChatDTO'
import type { CreateChannelInput, Paginated } from './Types'
import { CHANNEL_TTL_SECONDS, buildChannelId, ttlFromNow } from './Types'
import { chatForbidden } from './ChatOperationError'
import { validateIds } from './validation'

export class ChatChannelService {
  constructor(
    protected readonly chatChannelRepository: ChatChannelRepository,
    protected readonly logger: Logger
  ) {}

  async createChannelIfAbsent(input: CreateChannelInput): Promise<ChatChannelDTO> {
    validateIds({
      seekerId: input.seekerId,
      requestPostId: input.requestPostId,
      donorId: input.donorId
    })
    const channelId = buildChannelId(input.requestPostId, input.donorId)
    const nowMs = Date.now()
    const createdAt = new Date(nowMs).toISOString()
    const ttl = ttlFromNow(nowMs, CHANNEL_TTL_SECONDS)

    const channel: ChatChannelDTO = {
      channelId,
      seekerId: input.seekerId,
      requestPostId: input.requestPostId,
      donorId: input.donorId,
      status: ChatChannelStatus.OPEN,
      context: input.context,
      createdAt,
      ttl
    }
    const memberships: ChannelMembershipDTO[] = [
      this.buildMembership(input.seekerId, input.donorId, 'SEEKER', channel),
      this.buildMembership(input.donorId, input.seekerId, 'DONOR', channel)
    ]

    const { created, channel: result } = await this.chatChannelRepository.createChannelIfAbsent(
      channel,
      memberships
    )
    this.logger.info(created ? 'chat channel created' : 'chat channel already exists', { channelId })

    return result
  }

  private buildMembership(
    userId: string,
    otherParticipantId: string,
    role: ChannelRole,
    channel: ChatChannelDTO
  ): ChannelMembershipDTO {
    return {
      userId,
      channelId: channel.channelId,
      otherParticipantId,
      role,
      context: channel.context,
      createdAt: channel.createdAt,
      ttl: channel.ttl
    }
  }

  async lockChannel(channelId: string): Promise<void> {
    const channel = await this.chatChannelRepository.getChannel(channelId)
    if (channel === null) {
      this.logger.warn('lockChannel: channel not found', { channelId })

      return
    }
    if (channel.status === ChatChannelStatus.LOCKED) {
      return
    }
    await this.chatChannelRepository.updateStatus(channelId, ChatChannelStatus.LOCKED)
    this.logger.info('chat channel locked', { channelId })
  }

  async getChannel(channelId: string): Promise<ChatChannelDTO | null> {
    return this.chatChannelRepository.getChannel(channelId)
  }

  async getMembership(userId: string, channelId: string): Promise<ChannelMembershipDTO | null> {
    return this.chatChannelRepository.getMembership(userId, channelId)
  }

  async listChannelsForUser(
    userId: string,
    limit: number,
    cursor?: Record<string, unknown>
  ): Promise<Paginated<ChannelMembershipDTO>> {
    const { items, lastEvaluatedKey } = await this.chatChannelRepository.queryChannelsByUser(
      userId,
      limit,
      cursor
    )

    return { items, nextCursor: lastEvaluatedKey }
  }

  async recordLastMessage(
    channel: ChatChannelDTO,
    preview: string,
    at: string
  ): Promise<void> {
    await this.chatChannelRepository.updateLastMessageForMembers(
      [channel.seekerId, channel.donorId],
      channel.channelId,
      at,
      preview
    )
  }

  async updateLastReadAt(userId: string, channelId: string, readAt: string): Promise<void> {
    const membership = await this.chatChannelRepository.getMembership(userId, channelId)
    if (membership?.lastReadAt !== undefined && membership.lastReadAt >= readAt) {
      return
    }
    await this.chatChannelRepository.updateLastReadAt(userId, channelId, readAt)
  }

  assertParticipant(channel: ChatChannelDTO, userId: string): void {
    if (userId !== channel.seekerId && userId !== channel.donorId) {
      throw chatForbidden()
    }
  }

  otherParticipant(channel: ChatChannelDTO, userId: string): string {
    return userId === channel.seekerId ? channel.donorId : channel.seekerId
  }
}
