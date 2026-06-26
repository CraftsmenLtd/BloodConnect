import { GENERIC_CODES } from '../../../commons/libs/constants/GenericCodes'
import ChatOperationError from './ChatOperationError'
import { validateInputWithRules } from '../utils/validator'
import { generateUniqueID } from '../utils/idGenerator'
import { buildChannelId, calculateExpiryEpoch } from '../utils/chatChannel'
import { sendChatMessageValidationRules } from './Types'
import type {
  CreateChatChannelAttributes,
  SendChatMessageAttributes
} from './Types'
import type {
  ChatChannelDTO,
  ChatMessageDTO,
  UserChannelDTO
} from '../../../commons/dto/ChatDTO'
import type ChatChannelRepository from '../models/policies/repositories/ChatChannelRepository'
import type ChatMessageRepository from '../models/policies/repositories/ChatMessageRepository'
import type UserChannelRepository from '../models/policies/repositories/UserChannelRepository'
import type { Logger } from '../models/logger/Logger'
import { CHAT_HISTORY_PAGE_SIZE, CHAT_INBOX_PAGE_SIZE } from '../../../commons/libs/constants/NoMagicNumbers'

export class ChatService {
  constructor(
    protected readonly chatChannelRepository: ChatChannelRepository,
    protected readonly chatMessageRepository: ChatMessageRepository,
    protected readonly userChannelRepository: UserChannelRepository,
    protected readonly logger: Logger
  ) {}

  /** Idempotent: safe to call repeatedly from the DynamoDB stream. */
  async createChannel(attributes: CreateChatChannelAttributes): Promise<ChatChannelDTO> {
    const { seekerId, requestPostId, donorId, requestedBloodGroup } = attributes
    const channelId = buildChannelId(seekerId, requestPostId, donorId)

    const existing = await this.chatChannelRepository.getChannel(channelId)
    if (existing !== null) {
      return existing
    }

    const createdAt = new Date().toISOString()
    const channel: ChatChannelDTO = {
      channelId,
      seekerId,
      requestPostId,
      donorId,
      locked: false,
      createdAt
    }

    const createdChannel = await this.chatChannelRepository.create(channel).catch((error) => {
      throw new ChatOperationError(
        `Failed to create chat channel: ${this.getErrorMessage(error)}`,
        GENERIC_CODES.ERROR
      )
    })

    await Promise.all(
      [seekerId, donorId].map((userId) =>
        this.upsertUserChannel({
          userId,
          channelId,
          unreadCount: 0,
          requestedBloodGroup,
          updatedAt: createdAt
        })
      )
    )

    return createdChannel
  }

  async getChannel(channelId: string): Promise<ChatChannelDTO> {
    const channel = await this.chatChannelRepository.getChannel(channelId)
    if (channel === null) {
      throw new ChatOperationError('Chat channel not found.', GENERIC_CODES.NOT_FOUND)
    }

    return channel
  }

  async lockChannel(channelId: string): Promise<void> {
    const channel = await this.chatChannelRepository.getChannel(channelId)
    if (channel === null || channel.locked) {
      return
    }
    await this.chatChannelRepository.update({ channelId, locked: true }).catch((error) => {
      throw new ChatOperationError(
        `Failed to lock chat channel: ${this.getErrorMessage(error)}`,
        GENERIC_CODES.ERROR
      )
    })
  }

  async sendMessage(
    attributes: SendChatMessageAttributes
  ): Promise<{ message: ChatMessageDTO; recipientId: string }> {
    const validationError = validateInputWithRules(
      { content: attributes.content },
      sendChatMessageValidationRules
    )
    if (validationError !== null) {
      throw new ChatOperationError(validationError, GENERIC_CODES.BAD_REQUEST)
    }

    const channel = await this.getChannel(attributes.channelId)
    this.assertParticipant(channel, attributes.senderId)
    if (channel.locked) {
      throw new ChatOperationError(
        'This conversation is locked and no longer accepts messages.',
        GENERIC_CODES.BAD_REQUEST
      )
    }

    const createdAt = new Date().toISOString()
    const message: ChatMessageDTO = {
      channelId: channel.channelId,
      messageId: generateUniqueID(),
      senderId: attributes.senderId,
      content: attributes.content,
      createdAt,
      expiresAt: calculateExpiryEpoch()
    }

    const createdMessage = await this.chatMessageRepository.create(message).catch((error) => {
      throw new ChatOperationError(
        `Failed to send chat message: ${this.getErrorMessage(error)}`,
        GENERIC_CODES.ERROR
      )
    })

    const preview = this.buildPreview(attributes.content)
    await this.chatChannelRepository.update({
      channelId: channel.channelId,
      lastMessagePreview: preview,
      lastMessageAt: createdAt
    })

    const recipientId
      = channel.seekerId === attributes.senderId ? channel.donorId : channel.seekerId
    await Promise.all([
      this.bumpUnread(recipientId, channel.channelId, preview, createdAt),
      this.touchSenderChannel(attributes.senderId, channel.channelId, preview, createdAt)
    ])

    return { message: createdMessage, recipientId }
  }

  async getHistory(
    channelId: string,
    requesterId: string,
    limit: number = CHAT_HISTORY_PAGE_SIZE,
    exclusiveStartKey?: Record<string, unknown>
  ): Promise<{ items: ChatMessageDTO[]; lastEvaluatedKey?: Record<string, unknown> }> {
    const channel = await this.getChannel(channelId)
    this.assertParticipant(channel, requesterId)

    return this.chatMessageRepository.getChannelMessages(channelId, limit, exclusiveStartKey)
  }

  async getInbox(
    userId: string,
    limit: number = CHAT_INBOX_PAGE_SIZE,
    exclusiveStartKey?: Record<string, unknown>
  ): Promise<{ items: UserChannelDTO[]; lastEvaluatedKey?: Record<string, unknown> }> {
    return this.userChannelRepository.getUserChannels(userId, limit, exclusiveStartKey)
  }

  private assertParticipant(channel: ChatChannelDTO, userId: string): void {
    if (userId !== channel.seekerId && userId !== channel.donorId) {
      throw new ChatOperationError(
        'You are not a participant of this conversation.',
        GENERIC_CODES.UNAUTHORIZED
      )
    }
  }

  private async bumpUnread(
    userId: string,
    channelId: string,
    preview: string,
    updatedAt: string
  ): Promise<void> {
    const current = await this.userChannelRepository.getUserChannel(userId, channelId)
    await this.upsertUserChannel({
      userId,
      channelId,
      unreadCount: (current?.unreadCount ?? 0) + 1,
      requestedBloodGroup: current?.requestedBloodGroup,
      lastMessagePreview: preview,
      updatedAt
    })
  }

  private async touchSenderChannel(
    userId: string,
    channelId: string,
    preview: string,
    updatedAt: string
  ): Promise<void> {
    const current = await this.userChannelRepository.getUserChannel(userId, channelId)
    await this.upsertUserChannel({
      userId,
      channelId,
      unreadCount: current?.unreadCount ?? 0,
      requestedBloodGroup: current?.requestedBloodGroup,
      lastMessagePreview: preview,
      updatedAt
    })
  }

  private async upsertUserChannel(userChannel: UserChannelDTO): Promise<void> {
    await this.userChannelRepository.create(userChannel).catch((error) => {
      throw new ChatOperationError(
        `Failed to update user channel: ${this.getErrorMessage(error)}`,
        GENERIC_CODES.ERROR
      )
    })
  }

  private buildPreview(content: string): string {
    const PREVIEW_LENGTH = 120

    return content.length > PREVIEW_LENGTH ? `${content.slice(0, PREVIEW_LENGTH)}…` : content
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error'
  }
}
