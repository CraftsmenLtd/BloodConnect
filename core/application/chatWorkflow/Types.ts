import type {
  ChatChannelStatus,
  ChatHistoryCursor,
  ChatMessageDTO
} from '../../../commons/dto/ChatDTO'

export type CreateChatChannelAttributes = {
  seekerId: string;
  donorId: string;
  requestPostId: string;
}

export type ChatChannelAttributes = CreateChatChannelAttributes & {
  channelId: string;
  status: ChatChannelStatus;
  createdAt: string;
  lockedAt?: string;
  lastMessagePreview?: string;
  unreadCount?: number;
}

export type SendChatMessageAttributes = {
  channelId: string;
  senderId: string;
  text: string;
  createdAt: string;
}

export type ChatHistoryQueryAttributes = {
  channelId: string;
  limit?: number;
  exclusiveStartKey?: ChatHistoryCursor;
}

export type ChatHistoryResult = {
  messages: ChatMessageDTO[];
  lastEvaluatedKey?: ChatHistoryCursor;
}
