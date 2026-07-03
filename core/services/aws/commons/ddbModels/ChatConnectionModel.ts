import type { ChatConnectionDTO } from '../../../../../commons/dto/ChatDTO'
import type {
  DbModelDtoAdapter,
  HasTimeLog,
  NosqlModel,
  DbIndex,
  IndexDefinitions,
  IndexType
} from './DbModelDefinitions'

export const CHAT_CONN_PK_PREFIX = 'CHAT_CONN'
export const CHAT_CONN_SK = 'META'
export const CHAT_CONN_USER_GSI1PK_PREFIX = 'CHAT_CONN_USER'

export type ChatConnectionFields = Omit<ChatConnectionDTO, 'connectionId'> &
HasTimeLog & {
  PK: `${typeof CHAT_CONN_PK_PREFIX}#${string}`;
  SK: typeof CHAT_CONN_SK;
  GSI1PK: `${typeof CHAT_CONN_USER_GSI1PK_PREFIX}#${string}`;
  GSI1SK: string;
}

export class ChatConnectionModel
implements
    NosqlModel<ChatConnectionFields>,
    DbModelDtoAdapter<ChatConnectionDTO, ChatConnectionFields> {
  getIndexDefinitions(): IndexDefinitions<ChatConnectionFields> {
    return {
      GSI: {
        GSI1: { partitionKey: 'GSI1PK', sortKey: 'GSI1SK' }
      }
    }
  }

  getPrimaryIndex(): DbIndex<ChatConnectionFields> {
    return { partitionKey: 'PK', sortKey: 'SK' }
  }

  getIndex(indexType: IndexType, indexName: string): DbIndex<ChatConnectionFields> | undefined {
    return this.getIndexDefinitions()[indexType]?.[indexName]
  }

  fromDto(dto: ChatConnectionDTO): ChatConnectionFields {
    const { connectionId, ...remaining } = dto

    return {
      PK: `${CHAT_CONN_PK_PREFIX}#${connectionId}`,
      SK: CHAT_CONN_SK,
      GSI1PK: `${CHAT_CONN_USER_GSI1PK_PREFIX}#${dto.userId}`,
      GSI1SK: connectionId,
      ...remaining
    }
  }

  toDto(dbFields: ChatConnectionFields): ChatConnectionDTO {
    const { PK, SK: _SK, GSI1PK: _GSI1PK, GSI1SK: _GSI1SK, ...remaining } = dbFields

    return {
      ...remaining,
      connectionId: PK.replace(`${CHAT_CONN_PK_PREFIX}#`, '')
    }
  }
}
