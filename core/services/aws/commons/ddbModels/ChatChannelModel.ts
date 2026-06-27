import type { ChatChannelDTO } from '../../../../../commons/dto/ChatDTO'
import { CHAT_MESSAGE_RETENTION_DAYS } from '../../../../../commons/libs/constants/NoMagicNumbers'
import type {
  DbIndex,
  DbModelDtoAdapter,
  HasTimeLog,
  IndexDefinitions,
  IndexType,
  NosqlModel
} from './DbModelDefinitions'
import { USER_PK_PREFIX } from './UserModel'

export const CHAT_CHANNEL_PK_PREFIX = 'CHAT'
export const CHAT_CHANNEL_METADATA_SK = 'METADATA'

// Channel + pointer rows outlive their messages by this buffer so they self-clean
// after the last message TTL-expires, instead of orphaning (ADV-009).
const CHANNEL_RETENTION_BUFFER_DAYS = 7
const MILLISECONDS_PER_SECOND = 1000
const SECONDS_PER_DAY = 24 * 60 * 60

export type ChatChannelFields = Omit<ChatChannelDTO, 'channelId'> &
HasTimeLog & {
  PK: `${typeof CHAT_CHANNEL_PK_PREFIX}#${string}`;
  SK: typeof CHAT_CHANNEL_METADATA_SK;
  expiresAt: number;
}

export type ChatInboxPointerFields = {
  PK: `${typeof USER_PK_PREFIX}#${string}`;
  SK: `${typeof CHAT_CHANNEL_PK_PREFIX}#${string}`;
  lastMessagePreview?: string;
  unreadCount?: number;
  createdAt?: string;
  expiresAt: number;
}

const toEpochSeconds = (iso: string): number =>
  Math.floor(new Date(iso).getTime() / MILLISECONDS_PER_SECOND)

const channelExpiresAt = (createdAt: string): number =>
  toEpochSeconds(createdAt) +
  (CHAT_MESSAGE_RETENTION_DAYS + CHANNEL_RETENTION_BUFFER_DAYS) * SECONDS_PER_DAY

const inboxPointer = (
  userId: string,
  channel: ChatChannelDTO
): ChatInboxPointerFields => ({
  PK: `${USER_PK_PREFIX}#${userId}`,
  SK: `${CHAT_CHANNEL_PK_PREFIX}#${channel.channelId}`,
  lastMessagePreview: channel.lastMessagePreview,
  unreadCount: channel.unreadCount,
  createdAt: channel.createdAt,
  expiresAt: channelExpiresAt(channel.createdAt)
})

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

  fromDto(chatChannelDto: ChatChannelDTO): ChatChannelFields {
    const { channelId, ...remainingData } = chatChannelDto

    return {
      PK: `${CHAT_CHANNEL_PK_PREFIX}#${channelId}`,
      SK: CHAT_CHANNEL_METADATA_SK,
      ...remainingData,
      expiresAt: channelExpiresAt(chatChannelDto.createdAt)
    }
  }

  toDto(dbFields: ChatChannelFields): ChatChannelDTO {
    const { PK, SK, expiresAt, ...remainingFields } = dbFields

    return {
      ...remainingFields,
      channelId: PK.replace(`${CHAT_CHANNEL_PK_PREFIX}#`, '')
    }
  }

  // Both participant inbox pointers for a channel, so each user lists their
  // channels from their own USER# partition.
  toInboxPointers(chatChannelDto: ChatChannelDTO): ChatInboxPointerFields[] {
    return [
      inboxPointer(chatChannelDto.seekerId, chatChannelDto),
      inboxPointer(chatChannelDto.donorId, chatChannelDto)
    ]
  }
}
