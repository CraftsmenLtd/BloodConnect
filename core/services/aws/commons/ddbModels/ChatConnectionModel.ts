import type { ChatConnectionDTO } from '../../../../../commons/dto/ChatDTO'
import type {
  DbModelDtoAdapter,
  HasTimeLog,
  NosqlModel,
  DbIndex,
  IndexDefinitions,
  IndexType
} from './DbModelDefinitions'

export const CHAT_CONNECTION_PK_PREFIX = 'CONNECTION'
export const CHAT_CONNECTION_GSI1PK_PREFIX = 'CHATUSER'

// Keyed by connectionId (the only key $disconnect carries); GSI1 on userId lists a
// user's live connections for fanout.
export type ChatConnectionFields = Omit<ChatConnectionDTO, 'connectionId' | 'userId'> &
HasTimeLog & {
  PK: `${typeof CHAT_CONNECTION_PK_PREFIX}#${string}`;
  SK: `${typeof CHAT_CONNECTION_PK_PREFIX}#${string}`;
  GSI1PK: `${typeof CHAT_CONNECTION_GSI1PK_PREFIX}#${string}`;
  GSI1SK: `${typeof CHAT_CONNECTION_PK_PREFIX}#${string}`;
}

export class ChatConnectionModel
implements
    NosqlModel<ChatConnectionFields>,
    DbModelDtoAdapter<ChatConnectionDTO, ChatConnectionFields> {
  getIndexDefinitions(): IndexDefinitions<ChatConnectionFields> {
    return {
      GSI: {
        GSI1: {
          partitionKey: 'GSI1PK',
          sortKey: 'GSI1SK'
        }
      }
    }
  }

  getPrimaryIndex(): DbIndex<ChatConnectionFields> {
    return { partitionKey: 'PK', sortKey: 'SK' }
  }

  getIndex(indexType: IndexType, indexName: string): DbIndex<ChatConnectionFields> | undefined {
    return this.getIndexDefinitions()[indexType]?.[indexName]
  }

  fromDto(connectionDto: ChatConnectionDTO): ChatConnectionFields {
    const { connectionId, userId, ...remainingData } = connectionDto

    return {
      PK: `${CHAT_CONNECTION_PK_PREFIX}#${connectionId}`,
      SK: `${CHAT_CONNECTION_PK_PREFIX}#${connectionId}`,
      GSI1PK: `${CHAT_CONNECTION_GSI1PK_PREFIX}#${userId}`,
      GSI1SK: `${CHAT_CONNECTION_PK_PREFIX}#${connectionId}`,
      ...remainingData
    }
  }

  toDto(dbFields: ChatConnectionFields): ChatConnectionDTO {
    const { PK, SK, GSI1PK, GSI1SK, ...remainingFields } = dbFields

    return {
      ...remainingFields,
      connectionId: PK.replace(`${CHAT_CONNECTION_PK_PREFIX}#`, ''),
      userId: GSI1PK.replace(`${CHAT_CONNECTION_GSI1PK_PREFIX}#`, '')
    }
  }
}
