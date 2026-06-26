import type { ChatConnectionDTO } from '../../../../../commons/dto/ChatDTO'
import type {
  DbModelDtoAdapter,
  DbIndex,
  IndexDefinitions,
  IndexType,
  NosqlModel
} from './DbModelDefinitions'

export const CONNECTION_PK_PREFIX = 'CONN'
export const CONNECTION_META_SK = 'META'
export const CONNECTION_USER_GSI = 'GSI1'
export const CONNECTION_USER_PREFIX = 'USER'

export type ChatConnectionFields = Omit<ChatConnectionDTO, 'connectionId'> & {
  PK: `${typeof CONNECTION_PK_PREFIX}#${string}`;
  SK: typeof CONNECTION_META_SK;
  GSI1PK: `${typeof CONNECTION_USER_PREFIX}#${string}`;
  GSI1SK: `${typeof CONNECTION_PK_PREFIX}#${string}`;
}

export default class ChatConnectionModel
implements
    NosqlModel<ChatConnectionFields>,
    DbModelDtoAdapter<ChatConnectionDTO, ChatConnectionFields> {
  getIndexDefinitions(): IndexDefinitions<ChatConnectionFields> {
    return {
      GSI: {
        [CONNECTION_USER_GSI]: { partitionKey: 'GSI1PK', sortKey: 'GSI1SK' }
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
      PK: `${CONNECTION_PK_PREFIX}#${connectionId}`,
      SK: CONNECTION_META_SK,
      GSI1PK: `${CONNECTION_USER_PREFIX}#${dto.userId}`,
      GSI1SK: `${CONNECTION_PK_PREFIX}#${connectionId}`,
      ...remaining
    }
  }

  toDto(dbFields: ChatConnectionFields): ChatConnectionDTO {
    const { PK, SK, GSI1PK, GSI1SK, ...remaining } = dbFields

    return {
      ...remaining,
      connectionId: PK.replace(`${CONNECTION_PK_PREFIX}#`, '')
    } as ChatConnectionDTO
  }
}
