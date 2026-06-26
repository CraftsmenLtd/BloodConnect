import type { ChatMessageDTO } from '../../../../../commons/dto/ChatDTO'
import type Repository from './Repository'

type ChatMessageRepository = {
  getChannelMessages(
    channelId: string,
    limit?: number,
    exclusiveStartKey?: Record<string, unknown>
  ): Promise<{ items: ChatMessageDTO[]; lastEvaluatedKey?: Record<string, unknown> }>;
} & Repository<ChatMessageDTO>
export default ChatMessageRepository
