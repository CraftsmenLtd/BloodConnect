import type { ChatChannelDTO } from '../../../../../commons/dto/ChatDTO'
import type {
  DbModelDtoAdapter,
  DbIndex,
  IndexDefinitions,
  IndexType,
  NosqlModel
} from './DbModelDefinitions'

export const CHANNEL_PK_PREFIX = 'CHANNEL'
export const CHANNEL_META_SK = 'META'

export type ChatChannelFields = Omit<ChatChannelDTO, 'channelId'> & {
  PK: `${typeof CHANNEL_PK_PREFIX}#${string}`;
  SK: typeof CHANNEL_META_SK;
}

export default class ChatChannelModel
implements
    NosqlModel<ChatChannelFields>,
    DbModelDtoAdapter<ChatChannelDTO, ChatChannelFields> {
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
      PK: `${CHANNEL_PK_PREFIX}#${channelId}`,
      SK: CHANNEL_META_SK,
      ...remaining
    }
  }

  toDto(dbFields: ChatChannelFields): ChatChannelDTO {
    const { PK, SK, ...remaining } = dbFields

    return {
      ...remaining,
      channelId: PK.replace(`${CHANNEL_PK_PREFIX}#`, '')
    } as ChatChannelDTO
  }
}
