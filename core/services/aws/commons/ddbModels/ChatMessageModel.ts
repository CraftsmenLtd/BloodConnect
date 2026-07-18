import type { ChatMessageDTO } from '../../../../../commons/dto/ChatDTO'
import type {
  DbModelDtoAdapter,
  HasTimeLog,
  NosqlModel,
  DbIndex,
  IndexDefinitions,
  IndexType
} from './DbModelDefinitions'

export const CHAT_MESSAGE_PK_PREFIX = 'CHATMSG'
export const CHAT_MESSAGE_TTL_DAYS = 90
const SECONDS_PER_DAY = 24 * 60 * 60

// Messages live under a per-channel partition, sorted by the time-ordered messageId (ULID/ISO)
// for newest-first paging, and carry a DynamoDB TTL attribute for the 90-day purge.
export type ChatMessageFields = Omit<ChatMessageDTO, 'channelId' | 'messageId'> &
HasTimeLog & {
  PK: `${typeof CHAT_MESSAGE_PK_PREFIX}#${string}`;
  SK: `${string}`;
  ttl: number;
}

export class ChatMessageModel
implements
    NosqlModel<ChatMessageFields>,
    DbModelDtoAdapter<ChatMessageDTO, ChatMessageFields> {
  getIndexDefinitions(): IndexDefinitions<ChatMessageFields> {
    return {}
  }

  getPrimaryIndex(): DbIndex<ChatMessageFields> {
    return { partitionKey: 'PK', sortKey: 'SK' }
  }

  getIndex(indexType: IndexType, indexName: string): DbIndex<ChatMessageFields> | undefined {
    return this.getIndexDefinitions()[indexType]?.[indexName]
  }

  fromDto(messageDto: ChatMessageDTO): ChatMessageFields {
    const { channelId, messageId, ttl, createdAt, ...remainingData } = messageDto
    const ttlValue = ttl
      ?? Math.floor(new Date(createdAt).getTime() / 1000) + CHAT_MESSAGE_TTL_DAYS * SECONDS_PER_DAY

    return {
      PK: `${CHAT_MESSAGE_PK_PREFIX}#${channelId}`,
      SK: messageId,
      ttl: ttlValue,
      createdAt,
      ...remainingData
    }
  }

  toDto(dbFields: ChatMessageFields): ChatMessageDTO {
    const { PK, SK, ...remainingFields } = dbFields

    return {
      ...remainingFields,
      channelId: PK.replace(`${CHAT_MESSAGE_PK_PREFIX}#`, ''),
      messageId: SK
    }
  }
}
