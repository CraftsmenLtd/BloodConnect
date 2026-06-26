export type ChatChannelSummary = {
  userId: string;
  channelId: string;
  unreadCount: number;
  lastMessagePreview?: string;
  requestedBloodGroup?: string;
  updatedAt: string;
}

export type ChatMessage = {
  channelId: string;
  messageId: string;
  senderId: string;
  content: string;
  deliveredVia?: string;
  readAt?: string;
  createdAt: string;
}

export type ChatInboxData = {
  channels: ChatChannelSummary[];
  lastEvaluatedKey?: Record<string, unknown>;
}

export type ChatHistoryData = {
  messages: ChatMessage[];
  lastEvaluatedKey?: Record<string, unknown>;
}

export type OutgoingSocketMessage = {
  action: 'sendMessage';
  channelId: string;
  content: string;
}

export type IncomingSocketMessage =
  | { type: 'message'; data: ChatMessage }
  | { type: 'error'; message: string }
