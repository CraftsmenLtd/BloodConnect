import type { ChatChannelDTO } from '../../../commons/dto/ChatDTO'
import { assertParticipant as assertChannelParticipant } from './participants'

const ACTIVE_STATUS = 'ACTIVE' as const
const CHANNEL_ID_SEPARATOR = '#'
const POINTER_SK_PREFIX = `CHAT${CHANNEL_ID_SEPARATOR}`

// Inbox pointer rows live in the outer (DynamoDB) layer; the application layer
// depends only on this structural shape, never on the concrete model type.
export type InboxPointerRecord = {
  SK: string;
  lastMessagePreview?: string;
  unreadCount?: number;
}

export type ChatInboxEntry = {
  channelId: string;
  lastMessagePreview?: string;
  unreadCount?: number;
}

// Behavioural contract for the DynamoDB channel adapter; the application layer
// depends on this shape, not the concrete ops (matching the Repository pattern).
export type ChatChannelOps = {
  createChannel(channel: ChatChannelDTO): Promise<ChatChannelDTO>;
  getChannel(channelId: string): Promise<ChatChannelDTO | null>;
  listChannelsForUser(userId: string): Promise<InboxPointerRecord[]>;
  listChannelsForRequest(seekerId: string, requestPostId: string): Promise<InboxPointerRecord[]>;
  lockChannel(channelId: string): Promise<void>;
  incrementUnread(userId: string, channelId: string, preview: string): Promise<void>;
  resetUnread(userId: string, channelId: string): Promise<void>;
}

const buildChannelId = (seekerId: string, requestPostId: string, donorId: string): string =>
  [seekerId, requestPostId, donorId].join(CHANNEL_ID_SEPARATOR)

const pointerChannelId = (sk: string): string =>
  sk.startsWith(POINTER_SK_PREFIX) ? sk.slice(POINTER_SK_PREFIX.length) : sk

export class ChatChannelService {
  constructor(private readonly channelOps: ChatChannelOps) {}

  async createChannel(
    seekerId: string,
    requestPostId: string,
    donorId: string,
    createdAt: string = new Date().toISOString()
  ): Promise<ChatChannelDTO> {
    const channel: ChatChannelDTO = {
      channelId: buildChannelId(seekerId, requestPostId, donorId),
      seekerId,
      donorId,
      requestPostId,
      status: ACTIVE_STATUS,
      createdAt
    }

    return this.channelOps.createChannel(channel)
  }

  // Create-if-missing for the acceptance retry path (ADV-001): a duplicate accept
  // returns the existing channel instead of attempting a second create.
  async ensureChannel(
    seekerId: string,
    requestPostId: string,
    donorId: string,
    createdAt?: string
  ): Promise<ChatChannelDTO> {
    const channelId = buildChannelId(seekerId, requestPostId, donorId)
    const existing = await this.channelOps.getChannel(channelId)
    if (existing !== null) {
      return existing
    }

    return this.createChannel(seekerId, requestPostId, donorId, createdAt)
  }

  async lockChannel(channelId: string): Promise<void> {
    await this.channelOps.lockChannel(channelId)
  }

  // Locks the single (seekerId, requestPostId, donorId) channel — used by the
  // ignore-acceptance terminal path. Channel-id construction stays encapsulated here.
  async lockChannelForDonor(
    seekerId: string,
    requestPostId: string,
    donorId: string
  ): Promise<void> {
    await this.lockChannel(buildChannelId(seekerId, requestPostId, donorId))
  }

  async lockChannelsForRequest(seekerId: string, requestPostId: string): Promise<void> {
    const pointers = await this.channelOps.listChannelsForRequest(seekerId, requestPostId)
    await Promise.all(
      pointers.map((pointer) => this.channelOps.lockChannel(pointerChannelId(pointer.SK)))
    )
  }

  assertParticipant(channelId: string, userId: string): void {
    assertChannelParticipant(channelId, userId)
  }

  async listInbox(userId: string): Promise<ChatInboxEntry[]> {
    const pointers = await this.channelOps.listChannelsForUser(userId)

    return pointers.map((pointer) => ({
      channelId: pointerChannelId(pointer.SK),
      lastMessagePreview: pointer.lastMessagePreview,
      unreadCount: pointer.unreadCount
    }))
  }
}
