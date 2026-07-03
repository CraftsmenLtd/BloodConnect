import type { ChatMessageDTO } from 'commons/dto/ChatDTO'

type ChatMessageRepository = {
  createMessageIdempotent(
    message: ChatMessageDTO
  ): Promise<{ created: boolean; message: ChatMessageDTO }>;
  queryByChannel(
    channelId: string,
    limit: number,
    exclusiveStartKey?: Record<string, unknown>
  ): Promise<{ items: ChatMessageDTO[]; lastEvaluatedKey?: Record<string, unknown> }>;
  countSince(channelId: string, sinceIso: string, excludeSenderId: string): Promise<number>;
  incrementRateCounter(
    channelId: string,
    senderId: string,
    bucketMinute: string,
    ttl: number
  ): Promise<number>;
}
export default ChatMessageRepository
