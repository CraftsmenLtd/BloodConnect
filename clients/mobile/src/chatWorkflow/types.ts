export type MessageStatus = 'queued' | 'sending' | 'sent' | 'read'

export type ChatMessageView = {
  channelId: string;
  messageId?: string;
  clientMessageId: string;
  senderId: string;
  body: string;
  sentAt: string;
  status: MessageStatus;
}

export type ChannelContext = {
  requestedBloodGroup: string;
  urgencyLevel: string;
  donationDateTime: string;
  location: string;
}

export type ChannelSummary = {
  channelId: string;
  otherParticipantId: string;
  role: 'SEEKER' | 'DONOR';
  lastMessageAt?: string;
  lastMessagePreview?: string;
  lastReadAt?: string;
  unreadCount?: number;
  context?: ChannelContext;
}

export type OutboundFrame =
  | { action: 'sendMessage'; channelId: string; body: string; clientMessageId: string }
  | { action: 'typing'; channelId: string }
  | { action: 'markRead'; channelId: string }

export type InboundMessage = {
  channelId: string;
  messageId: string;
  clientMessageId: string;
  senderId: string;
  body: string;
  sentAt: string;
}

export type InboundEvent =
  | { type: 'MESSAGE'; channelId: string; message: InboundMessage }
  | { type: 'TYPING'; channelId: string; userId: string }
  | { type: 'READ_RECEIPT'; channelId: string; userId: string; readAt: string }
