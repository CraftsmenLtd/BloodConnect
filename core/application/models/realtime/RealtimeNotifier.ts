import type { ChatChannelDTO, ChatMessageDTO, ChatRealtimeEvent } from 'commons/dto/ChatDTO'

export type RealtimeNotifier = {
  postToConnections(
    connectionIds: string[],
    event: ChatRealtimeEvent
  ): Promise<{ staleConnectionIds: string[] }>;
}

export type OfflineNotifier = {
  notifyNewMessage(
    recipientId: string,
    channel: ChatChannelDTO,
    message: ChatMessageDTO
  ): Promise<void>;
}
