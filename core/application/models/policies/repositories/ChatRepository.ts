import type {
  ChatChannelDTO,
  ChatMembershipDTO,
  ChatMessageDTO
} from 'commons/dto/ChatDTO'

export type ChatHistoryPage = {
  items: ChatMessageDTO[];
  lastEvaluatedKey?: Record<string, unknown>;
}

// Multi-entity port: the chat channel, its per-participant membership items, and messages
// all live on the single table but are distinct item shapes, so this does not extend the
// single-DTO Repository base.
type ChatRepository = {
  // Channel: create-or-reopen to OPEN, conditional lock, per-request listing for lock-all.
  upsertChannelOpen(channel: ChatChannelDTO): Promise<ChatChannelDTO>;
  lockChannel(seekerId: string, requestPostId: string, donorId: string): Promise<void>;
  listChannelsForRequest(seekerId: string, requestPostId: string): Promise<ChatChannelDTO[]>;
  getChannel(
    seekerId: string,
    requestPostId: string,
    donorId: string
  ): Promise<ChatChannelDTO | null>;
  updateChannelLastMessage(
    seekerId: string,
    requestPostId: string,
    donorId: string,
    lastMessageAt: string
  ): Promise<void>;
  // Membership: one item per participant; listed by the caller's own user partition.
  upsertMembership(membership: ChatMembershipDTO): Promise<ChatMembershipDTO>;
  listMembershipsByUser(userId: string): Promise<ChatMembershipDTO[]>;
  updateLastRead(userId: string, channelId: string, lastReadAt: string): Promise<void>;
  // Bumps the denormalized lastMessageAt so listChannels reflects activity without a channel read.
  updateMembershipLastMessage(
    userId: string,
    channelId: string,
    lastMessageAt: string
  ): Promise<void>;
  // Message: append and read newest-first with a pagination cursor.
  putMessage(message: ChatMessageDTO): Promise<ChatMessageDTO>;
  queryMessages(
    channelId: string,
    limit?: number,
    exclusiveStartKey?: Record<string, unknown>
  ): Promise<ChatHistoryPage>;
}
export default ChatRepository
