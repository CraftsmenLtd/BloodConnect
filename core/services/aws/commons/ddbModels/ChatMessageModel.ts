import type { ChatMessageDTO } from '../../../../../commons/dto/ChatDTO'
import { CHAT_MESSAGE_RETENTION_DAYS } from '../../../../../commons/libs/constants/NoMagicNumbers'
import type {
  DbIndex,
  DbModelDtoAdapter,
  HasTimeLog,
  IndexDefinitions,
  IndexType,
  NosqlModel
} from './DbModelDefinitions'

export const CHAT_MESSAGE_PK_PREFIX = 'CHATMSG'

const MILLISECONDS_PER_SECOND = 1000
const SECONDS_PER_DAY = 24 * 60 * 60

export type ChatMessageFields = Omit<
ChatMessageDTO,
'channelId' | 'messageId' | 'createdAt'
> &
HasTimeLog & {
  PK: `${typeof CHAT_MESSAGE_PK_PREFIX}#${string}`;
  SK: `${string}#${string}`;
}

const toEpochSeconds = (iso: string): number =>
  Math.floor(new Date(iso).getTime() / MILLISECONDS_PER_SECOND)

const messageExpiresAt = (clientCreatedAt: string): number =>
  toEpochSeconds(clientCreatedAt) + CHAT_MESSAGE_RETENTION_DAYS * SECONDS_PER_DAY

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

  fromDto(chatMessageDto: ChatMessageDTO): ChatMessageFields {
    const { channelId, messageId, createdAt, ...remainingData } = chatMessageDto

    return {
      PK: `${CHAT_MESSAGE_PK_PREFIX}#${channelId}`,
      SK: `${createdAt}#${messageId}`,
      ...remainingData,
      expiresAt: messageExpiresAt(createdAt)
    }
  }

  toDto(dbFields: ChatMessageFields): ChatMessageDTO {
    const { PK, SK, ...remainingFields } = dbFields
    const [clientCreatedAt, messageId] = SK.split('#')

    return {
      ...remainingFields,
      channelId: PK.replace(`${CHAT_MESSAGE_PK_PREFIX}#`, ''),
      messageId,
      createdAt: clientCreatedAt
    }
  }
}
