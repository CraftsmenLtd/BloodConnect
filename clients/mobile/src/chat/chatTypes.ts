import type { ChatMembershipDTO, ChatMessageDTO } from '../../../../commons/dto/ChatDTO'

// A page of chat history mirrors the backend ChatHistoryPage port (newest-first items + cursor).
export type ChatHistoryPage = {
  items: ChatMessageDTO[];
  lastEvaluatedKey?: Record<string, unknown>;
}

// An inbox row derived from the caller's membership item: unread is computed client-side from
// lastMessageAt vs the caller's private lastReadAt (not a read receipt).
export type ChatInboxItem = {
  channelId: string;
  role: ChatMembershipDTO['role'];
  lastMessageAt?: string;
  lastReadAt?: string;
  unread: boolean;
}

// Body the client sends on the WebSocket sendMessage route. `action` drives the API Gateway route
// selection ($request.body.action); the handler reads channelId + content.
export type ChatSendPayload = {
  channelId: string;
  content: string;
}

export type { ChatMembershipDTO, ChatMessageDTO }
