import type {
  ChatChannelStatus,
  ChatHistoryCursor,
  ChatMessageDTO
} from '../../../commons/dto/ChatDTO'
import {
  CHAT_MESSAGE_RETENTION_DAYS,
  CHAT_RATE_LIMIT_PER_MINUTE
} from '../../../commons/libs/constants/NoMagicNumbers'
import { ChannelLockedError, ChatMessageValidationError, RateLimitError } from './ChatErrors'
import { assertParticipant, getRecipient } from './participants'
import type { ChatChannelOps } from './ChatChannelService'
import type { ChatHistoryResult } from './Types'

const MILLISECONDS_PER_SECOND = 1000
const SECONDS_PER_MINUTE = 60
const SECONDS_PER_DAY = 24 * 60 * 60
const RATE_LIMIT_WINDOW_SECONDS = 60
const CLOCK_DRIFT_TOLERANCE_MINUTES = 5
const DEFAULT_HISTORY_LIMIT = 50
const ACTIVE_STATUS: ChatChannelStatus = 'ACTIVE'
const LOCKED_STATUS: ChatChannelStatus = 'LOCKED'

// Supplied to addMessage as an atomic guard: the message write only commits while
// the channel row is still ACTIVE, so a concurrent lock can't leak a message (ADV-006).
export type ChannelStatusGuard = {
  conditionExpression: string;
  expressionAttributeValues?: Record<string, unknown>;
  expressionAttributeNames?: Record<string, string>;
}

export type ChatMessagePage = {
  messages: ChatMessageDTO[];
  nextCursor?: ChatHistoryCursor;
}

// Behavioural contract for the DynamoDB message adapter (see ChatChannelOps).
export type ChatMessageOps = {
  addMessage(message: ChatMessageDTO, guard?: ChannelStatusGuard): Promise<ChatMessageDTO>;
  getHistory(channelId: string, limit: number, cursor?: ChatHistoryCursor): Promise<ChatMessagePage>;
  countMessagesSince(channelId: string, epochSeconds: number): Promise<number>;
}

const ACTIVE_CHANNEL_GUARD: ChannelStatusGuard = {
  conditionExpression: '#status = :active',
  expressionAttributeNames: { '#status': 'status' },
  expressionAttributeValues: { ':active': ACTIVE_STATUS }
}

const nowEpochSeconds = (): number => Math.floor(Date.now() / MILLISECONDS_PER_SECOND)

const messageExpiresAt = (clientCreatedAt: string): number =>
  Math.floor(new Date(clientCreatedAt).getTime() / MILLISECONDS_PER_SECOND)
  + CHAT_MESSAGE_RETENTION_DAYS * SECONDS_PER_DAY

const buildMessage = (
  channelId: string,
  senderId: string,
  text: string,
  clientCreatedAt: string,
  messageId: string
): ChatMessageDTO => ({
  channelId,
  messageId,
  senderId,
  text,
  createdAt: clientCreatedAt,
  expiresAt: messageExpiresAt(clientCreatedAt)
})

export class ChatMessageService {
  constructor(
    private readonly messageOps: ChatMessageOps,
    private readonly channelOps: ChatChannelOps
  ) {}

  async sendMessage(
    channelId: string,
    senderId: string,
    text: string,
    clientCreatedAt: string,
    messageId: string
  ): Promise<ChatMessageDTO> {
    assertParticipant(channelId, senderId)
    this.validateClientTimestamp(clientCreatedAt)
    await this.assertWithinRateLimit(channelId)
    const message = buildMessage(channelId, senderId, text, clientCreatedAt, messageId)
    const stored = await this.writeWithLockGuard(message)
    if (stored) {
      await this.channelOps.incrementUnread(getRecipient(channelId, senderId), channelId, text)
    }

    return message
  }

  async getHistory(
    channelId: string,
    userId: string,
    limit?: number,
    cursor?: ChatHistoryCursor
  ): Promise<ChatHistoryResult> {
    assertParticipant(channelId, userId)
    const page = await this.messageOps.getHistory(channelId, limit ?? DEFAULT_HISTORY_LIMIT, cursor)

    return { messages: page.messages, lastEvaluatedKey: page.nextCursor }
  }

  async markRead(channelId: string, userId: string): Promise<void> {
    assertParticipant(channelId, userId)
    await this.channelOps.resetUnread(userId, channelId)
  }

  private validateClientTimestamp(clientCreatedAt: string): void {
    const clientTime = new Date(clientCreatedAt).getTime()
    if (Number.isNaN(clientTime)) {
      throw new ChatMessageValidationError('Invalid message timestamp')
    }
    const drift = Math.abs(Date.now() - clientTime)
    const tolerance = CLOCK_DRIFT_TOLERANCE_MINUTES * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND
    if (drift > tolerance) {
      throw new ChatMessageValidationError('Message timestamp is outside the allowed drift window')
    }
  }

  private async assertWithinRateLimit(channelId: string): Promise<void> {
    const windowStart = nowEpochSeconds() - RATE_LIMIT_WINDOW_SECONDS
    const recentCount = await this.messageOps.countMessagesSince(channelId, windowStart)
    if (recentCount >= CHAT_RATE_LIMIT_PER_MINUTE) {
      throw new RateLimitError()
    }
  }

  // The guarded write is the authoritative lock check (the pre-read alone is TOCTOU).
  // A failure is either a concurrent lock or an idempotent dedupe of a re-sent message.
  private async writeWithLockGuard(message: ChatMessageDTO): Promise<boolean> {
    try {
      await this.messageOps.addMessage(message, ACTIVE_CHANNEL_GUARD)

      return true
    } catch {
      await this.assertChannelNotLocked(message.channelId)

      return false
    }
  }

  private async assertChannelNotLocked(channelId: string): Promise<void> {
    const channel = await this.channelOps.getChannel(channelId)
    if (channel === null || channel.status === LOCKED_STATUS) {
      throw new ChannelLockedError()
    }
  }
}
