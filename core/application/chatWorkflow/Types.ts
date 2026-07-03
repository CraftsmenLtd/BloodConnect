import type { ChatChannelContext } from '../../../commons/dto/ChatDTO'

export type CreateChannelInput = {
  seekerId: string;
  requestPostId: string;
  donorId: string;
  context: ChatChannelContext;
}

export type SendMessageInput = {
  channelId: string;
  senderId: string;
  body: string;
  clientMessageId: string;
}

export type Paginated<T> = {
  items: T[];
  nextCursor?: Record<string, unknown>;
}

export type GetChatHistoryEvent = {
  requesterId: string;
  channelId: string;
  cursor?: string;
  limit?: number;
}

export type GetChatChannelsEvent = {
  requesterId: string;
  cursor?: string;
  limit?: number;
}

export const CHANNEL_TTL_SECONDS = 90 * 24 * 60 * 60
export const CONNECTION_TTL_SECONDS = 2 * 60 * 60
export const RATE_LIMIT_TTL_SECONDS = 120
export const MAX_MESSAGE_LENGTH = 2000
export const MESSAGE_PREVIEW_LENGTH = 120
export const RATE_LIMIT_PER_MINUTE = 60
export const HISTORY_PAGE_SIZE = 20
export const EPOCH_ISO = '1970-01-01T00:00:00.000Z'

export const buildChannelId = (requestPostId: string, donorId: string): string =>
  `${requestPostId}#${donorId}`

export const parseChannelId = (channelId: string): { requestPostId: string; donorId: string } => {
  const separatorIndex = channelId.indexOf('#')

  return {
    requestPostId: channelId.slice(0, separatorIndex),
    donorId: channelId.slice(separatorIndex + 1)
  }
}

export const ttlFromNow = (nowMs: number, seconds: number): number =>
  Math.floor(nowMs / 1000) + seconds

export const messagePreview = (body: string): string => body.slice(0, MESSAGE_PREVIEW_LENGTH)
