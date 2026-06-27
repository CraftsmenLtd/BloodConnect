import type { DTO } from './DTOCommon'

export type ChatChannelStatus = 'ACTIVE' | 'LOCKED'

export type ChatChannelDTO = DTO & {
  channelId: string;
  seekerId: string;
  donorId: string;
  requestPostId: string;
  status: ChatChannelStatus;
  createdAt: string;
  lockedAt?: string;
  lastMessagePreview?: string;
  unreadCount?: number;
}

export type ChatMessageDTO = DTO & {
  channelId: string;
  messageId: string;
  senderId: string;
  text: string;
  createdAt: string;
  expiresAt: number;
}

export type ChatHistoryCursor = Record<string, unknown>

export type ChatHistoryQueryDTO = {
  channelId: string;
  limit?: number;
  lastEvaluatedKey?: ChatHistoryCursor;
}

export type ChatHistoryResultDTO = {
  messages: ChatMessageDTO[];
  lastEvaluatedKey?: ChatHistoryCursor;
}
