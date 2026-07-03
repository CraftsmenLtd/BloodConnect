import type { ChannelMembershipDTO } from '../../../../../commons/dto/ChatDTO'
import type {
  DbModelDtoAdapter,
  HasTimeLog,
  NosqlModel,
  DbIndex,
  IndexDefinitions,
  IndexType
} from './DbModelDefinitions'

export const CHAT_USER_PK_PREFIX = 'CHAT_USER'
export const CHAT_MEMBERSHIP_SK_PREFIX = 'CHANNEL'

export type ChatMembershipFields = Omit<ChannelMembershipDTO, 'userId' | 'channelId'> &
HasTimeLog & {
  PK: `${typeof CHAT_USER_PK_PREFIX}#${string}`;
  SK: `${typeof CHAT_MEMBERSHIP_SK_PREFIX}#${string}`;
  GSI1PK: `${typeof CHAT_USER_PK_PREFIX}#${string}`;
  GSI1SK: string;
}

export class ChatChannelMembershipModel
implements
    NosqlModel<ChatMembershipFields>,
    DbModelDtoAdapter<ChannelMembershipDTO, ChatMembershipFields> {
  getIndexDefinitions(): IndexDefinitions<ChatMembershipFields> {
    return {
      GSI: {
        GSI1: { partitionKey: 'GSI1PK', sortKey: 'GSI1SK' }
      }
    }
  }

  getPrimaryIndex(): DbIndex<ChatMembershipFields> {
    return { partitionKey: 'PK', sortKey: 'SK' }
  }

  getIndex(indexType: IndexType, indexName: string): DbIndex<ChatMembershipFields> | undefined {
    return this.getIndexDefinitions()[indexType]?.[indexName]
  }

  fromDto(dto: ChannelMembershipDTO): ChatMembershipFields {
    const { userId, channelId, ...remaining } = dto
    const recencyKey = `${dto.lastMessageAt ?? dto.createdAt}#${channelId}`

    return {
      PK: `${CHAT_USER_PK_PREFIX}#${userId}`,
      SK: `${CHAT_MEMBERSHIP_SK_PREFIX}#${channelId}`,
      GSI1PK: `${CHAT_USER_PK_PREFIX}#${userId}`,
      GSI1SK: recencyKey,
      ...remaining
    }
  }

  toDto(dbFields: ChatMembershipFields): ChannelMembershipDTO {
    const { PK, SK, GSI1PK: _GSI1PK, GSI1SK: _GSI1SK, ...remaining } = dbFields

    return {
      ...remaining,
      userId: PK.replace(`${CHAT_USER_PK_PREFIX}#`, ''),
      channelId: SK.replace(`${CHAT_MEMBERSHIP_SK_PREFIX}#`, '')
    }
  }
}
