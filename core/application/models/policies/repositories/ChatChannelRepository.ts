import type {
  ChatChannelDTO,
  ChannelMembershipDTO,
  ChatChannelStatus
} from 'commons/dto/ChatDTO'

type ChatChannelRepository = {
  getChannel(channelId: string): Promise<ChatChannelDTO | null>;
  createChannelIfAbsent(
    channel: ChatChannelDTO,
    memberships: ChannelMembershipDTO[]
  ): Promise<{ created: boolean; channel: ChatChannelDTO }>;
  updateStatus(channelId: string, status: ChatChannelStatus): Promise<void>;
  updateLastMessageForMembers(
    memberUserIds: string[],
    channelId: string,
    lastMessageAt: string,
    lastMessagePreview: string
  ): Promise<void>;
  queryChannelsByUser(
    userId: string,
    limit: number,
    exclusiveStartKey?: Record<string, unknown>
  ): Promise<{ items: ChannelMembershipDTO[]; lastEvaluatedKey?: Record<string, unknown> }>;
  getMembership(userId: string, channelId: string): Promise<ChannelMembershipDTO | null>;
  updateLastReadAt(userId: string, channelId: string, lastReadAt: string): Promise<void>;
}
export default ChatChannelRepository
