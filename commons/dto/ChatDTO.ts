import type { DTO } from './DTOCommon'

export enum ChatChannelStatus {
  OPEN = 'OPEN',
  LOCKED = 'LOCKED'
}

export type ChannelRole = 'SEEKER' | 'DONOR'

export type ChatChannelContext = {
  requestedBloodGroup: string;
  urgencyLevel: string;
  donationDateTime: string;
  location: string;
}

export type ChatChannelDTO = DTO & {
  channelId: string;
  seekerId: string;
  requestPostId: string;
  donorId: string;
  status: ChatChannelStatus;
  context: ChatChannelContext;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  createdAt: string;
  ttl: number;
}

export type ChannelMembershipDTO = DTO & {
  userId: string;
  channelId: string;
  otherParticipantId: string;
  role: ChannelRole;
  context: ChatChannelContext;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  lastReadAt?: string;
  createdAt: string;
  ttl: number;
}

export type ChatMessageDTO = DTO & {
  channelId: string;
  messageId: string;
  clientMessageId: string;
  senderId: string;
  body: string;
  sentAt: string;
  ttl: number;
}

export type ChatConnectionDTO = DTO & {
  connectionId: string;
  userId: string;
  connectedAt: string;
  ttl: number;
}

export enum ChatRealtimeEventType {
  MESSAGE = 'MESSAGE',
  TYPING = 'TYPING',
  READ_RECEIPT = 'READ_RECEIPT'
}

export type ChatRealtimeEvent =
  | { type: ChatRealtimeEventType.MESSAGE; channelId: string; message: ChatMessageDTO }
  | { type: ChatRealtimeEventType.TYPING; channelId: string; userId: string }
  | { type: ChatRealtimeEventType.READ_RECEIPT; channelId: string; userId: string; readAt: string }
