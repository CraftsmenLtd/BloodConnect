import type { ChatMessageDTO } from '../../../../../commons/dto/ChatDTO'
import type {
  DbModelDtoAdapter,
  HasTimeLog,
  NosqlModel,
  DbIndex,
  IndexDefinitions,
  IndexType
} from './DbModelDefinitions'

export const CHAT_MSG_PK_PREFIX = 'CHAT_MSG'
export const CHAT_MSG_SK_PREFIX = 'MSG'

export type ChatMessageFields = Omit<ChatMessageDTO, 'channelId'> &
HasTimeLog & {
  PK: `${typeof CHAT_MSG_PK_PREFIX}#${string}`;
  SK: `${typeof CHAT_MSG_SK_PREFIX}#${string}#${string}`;
}

export class ChatMessageModel
implements NosqlModel<ChatMessageFields>, DbModelDtoAdapter<ChatMessageDTO, ChatMessageFields> {
  getIndexDefinitions(): IndexDefinitions<ChatMessageFields> {
    return {}
  }

  getPrimaryIndex(): DbIndex<ChatMessageFields> {
    return { partitionKey: 'PK', sortKey: 'SK' }
  }

  getIndex(indexType: IndexType, indexName: string): DbIndex<ChatMessageFields> | undefined {
    return this.getIndexDefinitions()[indexType]?.[indexName]
  }

  fromDto(dto: ChatMessageDTO): ChatMessageFields {
    const { channelId, ...remaining } = dto

    return {
      PK: `${CHAT_MSG_PK_PREFIX}#${channelId}`,
      SK: `${CHAT_MSG_SK_PREFIX}#${dto.sentAt}#${dto.messageId}`,
      ...remaining
    }
  }

  toDto(dbFields: ChatMessageFields): ChatMessageDTO {
    const { PK, SK: _SK, ...remaining } = dbFields

    return {
      ...remaining,
      channelId: PK.replace(`${CHAT_MSG_PK_PREFIX}#`, '')
    }
  }
}
