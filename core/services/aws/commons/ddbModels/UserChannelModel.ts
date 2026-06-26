import type { UserChannelDTO } from '../../../../../commons/dto/ChatDTO'
import type {
  DbModelDtoAdapter,
  DbIndex,
  IndexDefinitions,
  IndexType,
  NosqlModel
} from './DbModelDefinitions'

export const USER_CHANNEL_PK_PREFIX = 'USER'
export const USER_CHANNEL_SK_PREFIX = 'CHANNEL'

export type UserChannelFields = Omit<UserChannelDTO, 'userId' | 'channelId'> & {
  PK: `${typeof USER_CHANNEL_PK_PREFIX}#${string}`;
  SK: `${typeof USER_CHANNEL_SK_PREFIX}#${string}`;
}

export default class UserChannelModel
implements
    NosqlModel<UserChannelFields>,
    DbModelDtoAdapter<UserChannelDTO, UserChannelFields> {
  getIndexDefinitions(): IndexDefinitions<UserChannelFields> {
    return {}
  }

  getPrimaryIndex(): DbIndex<UserChannelFields> {
    return { partitionKey: 'PK', sortKey: 'SK' }
  }

  getIndex(indexType: IndexType, indexName: string): DbIndex<UserChannelFields> | undefined {
    return this.getIndexDefinitions()[indexType]?.[indexName]
  }

  fromDto(dto: UserChannelDTO): UserChannelFields {
    const { userId, channelId, ...remaining } = dto

    return {
      PK: `${USER_CHANNEL_PK_PREFIX}#${userId}`,
      SK: `${USER_CHANNEL_SK_PREFIX}#${channelId}`,
      ...remaining
    }
  }

  toDto(dbFields: UserChannelFields): UserChannelDTO {
    const { PK, SK, ...remaining } = dbFields

    return {
      ...remaining,
      userId: PK.replace(`${USER_CHANNEL_PK_PREFIX}#`, ''),
      channelId: SK.replace(`${USER_CHANNEL_SK_PREFIX}#`, '')
    } as UserChannelDTO
  }
}
