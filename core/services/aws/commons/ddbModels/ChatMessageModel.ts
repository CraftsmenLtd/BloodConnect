import type { ChatMessageDTO } from '../../../../../commons/dto/ChatDTO'
import { CHANNEL_PK_PREFIX } from './ChatChannelModel'
import type {
  DbModelDtoAdapter,
  DbIndex,
  IndexDefinitions,
  IndexType,
  NosqlModel
} from './DbModelDefinitions'

export const MESSAGE_SK_PREFIX = 'MSG'

export type ChatMessageFields = Omit<ChatMessageDTO, 'channelId' | 'messageId'> & {
  PK: `${typeof CHANNEL_PK_PREFIX}#${string}`;
  SK: `${typeof MESSAGE_SK_PREFIX}#${string}#${string}`;
}

export default class ChatMessageModel
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

  fromDto(dto: ChatMessageDTO): ChatMessageFields {
    const { channelId, messageId, ...remaining } = dto

    return {
      PK: `${CHANNEL_PK_PREFIX}#${channelId}`,
      SK: `${MESSAGE_SK_PREFIX}#${dto.createdAt}#${messageId}`,
      ...remaining
    }
  }

  toDto(dbFields: ChatMessageFields): ChatMessageDTO {
    const { PK, SK, ...remaining } = dbFields

    return {
      ...remaining,
      channelId: PK.replace(`${CHANNEL_PK_PREFIX}#`, ''),
      messageId: SK.split('#')[2]
    } as ChatMessageDTO
  }
}
