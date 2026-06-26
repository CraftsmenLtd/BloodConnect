import type { ChatMembershipDTO } from '../../../../../commons/dto/ChatDTO'
import type {
  DbModelDtoAdapter,
  HasTimeLog,
  NosqlModel,
  DbIndex,
  IndexDefinitions,
  IndexType
} from './DbModelDefinitions'

export const CHAT_MEMBERSHIP_PK_PREFIX = 'CHATUSER'
export const CHAT_MEMBERSHIP_SK_PREFIX = 'CHANNEL'

// One membership item per participant, so each user lists their channels by base-table PK query.
export type ChatMembershipFields = Omit<ChatMembershipDTO, 'userId' | 'channelId'> &
HasTimeLog & {
  PK: `${typeof CHAT_MEMBERSHIP_PK_PREFIX}#${string}`;
  SK: `${typeof CHAT_MEMBERSHIP_SK_PREFIX}#${string}`;
}

export class ChatMembershipModel
implements
    NosqlModel<ChatMembershipFields>,
    DbModelDtoAdapter<ChatMembershipDTO, ChatMembershipFields> {
  getIndexDefinitions(): IndexDefinitions<ChatMembershipFields> {
    return {}
  }

  getPrimaryIndex(): DbIndex<ChatMembershipFields> {
    return { partitionKey: 'PK', sortKey: 'SK' }
  }

  getIndex(indexType: IndexType, indexName: string): DbIndex<ChatMembershipFields> | undefined {
    return this.getIndexDefinitions()[indexType]?.[indexName]
  }

  fromDto(membershipDto: ChatMembershipDTO): ChatMembershipFields {
    const { userId, channelId, ...remainingData } = membershipDto

    return {
      PK: `${CHAT_MEMBERSHIP_PK_PREFIX}#${userId}`,
      SK: `${CHAT_MEMBERSHIP_SK_PREFIX}#${channelId}`,
      ...remainingData
    }
  }

  toDto(dbFields: ChatMembershipFields): ChatMembershipDTO {
    const { PK, SK, ...remainingFields } = dbFields

    return {
      ...remainingFields,
      userId: PK.replace(`${CHAT_MEMBERSHIP_PK_PREFIX}#`, ''),
      channelId: SK.replace(`${CHAT_MEMBERSHIP_SK_PREFIX}#`, '')
    }
  }
}
