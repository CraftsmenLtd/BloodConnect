import type { ChatChannelDTO } from '../../../../../commons/dto/ChatDTO'
import type {
  DbModelDtoAdapter,
  HasTimeLog,
  NosqlModel,
  DbIndex,
  IndexDefinitions,
  IndexType
} from './DbModelDefinitions'

export const CHAT_CHANNEL_PK_PREFIX = 'CHANNEL'
export const CHAT_CHANNEL_SK_PREFIX = 'DONOR'

// channelId is the composite identity carried on membership and message items.
export const buildChannelId = (seekerId: string, requestPostId: string, donorId: string): string =>
  `${seekerId}#${requestPostId}#${donorId}`

export const parseChannelId = (
  channelId: string
): { seekerId: string; requestPostId: string; donorId: string } => {
  const [seekerId, requestPostId, donorId] = channelId.split('#')

  return { seekerId, requestPostId, donorId }
}

export type ChatChannelFields = Omit<
ChatChannelDTO,
'channelId' | 'seekerId' | 'requestPostId' | 'donorId'
> &
HasTimeLog & {
  PK: `${typeof CHAT_CHANNEL_PK_PREFIX}#${string}#${string}`;
  SK: `${typeof CHAT_CHANNEL_SK_PREFIX}#${string}`;
}

export class ChatChannelModel
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

  fromDto(channelDto: ChatChannelDTO): ChatChannelFields {
    const { channelId, seekerId, requestPostId, donorId, ...remainingData } = channelDto

    return {
      PK: `${CHAT_CHANNEL_PK_PREFIX}#${seekerId}#${requestPostId}`,
      SK: `${CHAT_CHANNEL_SK_PREFIX}#${donorId}`,
      ...remainingData
    }
  }

  toDto(dbFields: ChatChannelFields): ChatChannelDTO {
    const { PK, SK, ...remainingFields } = dbFields
    const seekerId = PK.replace(`${CHAT_CHANNEL_PK_PREFIX}#`, '').split('#')[0]
    const requestPostId = PK.replace(`${CHAT_CHANNEL_PK_PREFIX}#`, '').split('#')[1]
    const donorId = SK.replace(`${CHAT_CHANNEL_SK_PREFIX}#`, '')

    return {
      ...remainingFields,
      channelId: buildChannelId(seekerId, requestPostId, donorId),
      seekerId,
      requestPostId,
      donorId
    }
  }
}
