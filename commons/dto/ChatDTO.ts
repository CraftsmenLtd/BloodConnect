import type { BloodGroup } from './DonationDTO'
import type { DTO } from './DTOCommon'

export enum MessageDeliveryMethod {
  WEBSOCKET = 'WEBSOCKET',
  PUSH = 'PUSH'
}

export type ChatChannelDTO = DTO & {
  channelId: string;
  seekerId: string;
  requestPostId: string;
  donorId: string;
  locked: boolean;
  lastMessagePreview?: string;
  lastMessageAt?: string;
  createdAt: string;
}

export type ChatMessageDTO = DTO & {
  channelId: string;
  messageId: string;
  senderId: string;
  content: string;
  deliveredVia?: MessageDeliveryMethod;
  readAt?: string;
  createdAt: string;
  expiresAt: number;
}

export type ChatConnectionDTO = DTO & {
  connectionId: string;
  userId: string;
  connectedAt: string;
  expiresAt: number;
}

export type UserChannelDTO = DTO & {
  userId: string;
  channelId: string;
  unreadCount: number;
  lastMessagePreview?: string;
  requestedBloodGroup?: BloodGroup;
  updatedAt: string;
}

export type ChatMessagePayload = {
  channelId: string;
  senderId: string;
  requestPostId: string;
}