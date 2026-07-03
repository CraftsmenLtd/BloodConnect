import type { ChatChannelDTO } from '../../../../../commons/dto/ChatDTO'
import type {
  DbModelDtoAdapter,
  HasTimeLog,
  NosqlModel,
  DbIndex,
  IndexDefinitions,
  IndexType
} from './DbModelDefinitions'

export const CHAT_CHANNEL_PK_PREFIX = 'CHAT_CHANNEL'
export const CHAT_CHANNEL_SK = 'META'

export type ChatChannelFields = Omit<ChatChannelDTO, 'channelId'> &
HasTimeLog & {
  PK: `${typeof CHAT_CHANNEL_PK_PREFIX}#${string}`;
  SK: typeof CHAT_CHANNEL_SK;
}

export class ChatChannelModel
implements NosqlModel<ChatChannelFields>, DbModelDtoAdapter<ChatChannelDTO, ChatChannelFields> {
  getIndexDefinitions(): IndexDefinitions<ChatChannelFields> {
    return {}
  }

  getPrimaryIndex(): DbIndex<ChatChannelFields> {
    return { partitionKey: 'PK', sortKey: 'SK' }
  }

  getIndex(indexType: IndexType, indexName: string): DbIndex<ChatChannelFields> | undefined {
    return this.getIndexDefinitions()[indexType]?.[indexName]
  }

  fromDto(dto: ChatChannelDTO): ChatChannelFields {
    const { channelId, ...remaining } = dto

    return {
      PK: `${CHAT_CHANNEL_PK_PREFIX}#${channelId}`,
      SK: CHAT_CHANNEL_SK,
      ...remaining
    }
  }

  toDto(dbFields: ChatChannelFields): ChatChannelDTO {
    const { PK, SK: _SK, ...remaining } = dbFields

    return {
      ...remaining,
      channelId: PK.replace(`${CHAT_CHANNEL_PK_PREFIX}#`, '')
    }
  }
}
