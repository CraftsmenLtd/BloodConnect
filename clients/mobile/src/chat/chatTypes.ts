import type {
  ChatChannelStatus,
  ChatContextSnapshot,
  ChatMembershipDTO,
  ChatMessageDTO
} from '../../../../commons/dto/ChatDTO'

// A page of chat history mirrors the backend ChatHistoryPage port (newest-first items + cursor).
export type ChatHistoryPage = {
  items: ChatMessageDTO[];
  lastEvaluatedKey?: Record<string, unknown>;
}

// The channel's status and snapshotted request context, returned alongside history so the chat room
// renders its header and locked banner on a cold-start deep-link without a separate post fetch.
export type ChatChannelContext = {
  status: ChatChannelStatus;
  context: ChatContextSnapshot;
}

// getHistory returns the channel context plus a page of messages in one call.
export type ChatHistoryResult = {
  channel: ChatChannelContext | null;
  page: ChatHistoryPage;
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

export { ChatChannelStatus } from '../../../../commons/dto/ChatDTO'
export type { ChatContextSnapshot, ChatMembershipDTO, ChatMessageDTO }
