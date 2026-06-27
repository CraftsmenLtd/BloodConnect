import { WS_CONNECTION_TTL_HOURS } from '../../../../../commons/libs/constants/NoMagicNumbers'
import type {
  DbIndex,
  DbModelDtoAdapter,
  HasTimeLog,
  IndexDefinitions,
  IndexType,
  NosqlModel
} from './DbModelDefinitions'

export const WS_CONNECTION_PK_PREFIX = 'WSCONN'

const MILLISECONDS_PER_SECOND = 1000
const SECONDS_PER_HOUR = 60 * 60

// Internal connectionId<->userId mapping; not a cross-layer shape, so kept local
// rather than in commons/dto (owned by TASK-001).
export type WsConnectionDTO = {
  userId: string;
  connectionId: string;
  createdAt?: string;
  updatedAt?: string;
  expiresAt?: number;
}

export type WsConnectionFields = Omit<WsConnectionDTO, 'userId' | 'connectionId'> &
HasTimeLog & {
  PK: `${typeof WS_CONNECTION_PK_PREFIX}#${string}`;
  SK: `${string}`;
  expiresAt: number;
}

const connectionExpiresAt = (): number =>
  Math.floor(Date.now() / MILLISECONDS_PER_SECOND)
  + WS_CONNECTION_TTL_HOURS * SECONDS_PER_HOUR

export class WsConnectionModel
implements
    NosqlModel<WsConnectionFields>,
    DbModelDtoAdapter<WsConnectionDTO, WsConnectionFields> {
  getIndexDefinitions(): IndexDefinitions<WsConnectionFields> {
    return {}
  }

  getPrimaryIndex(): DbIndex<WsConnectionFields> {
    return { partitionKey: 'PK', sortKey: 'SK' }
  }

  getIndex(indexType: IndexType, indexName: string): DbIndex<WsConnectionFields> | undefined {
    return this.getIndexDefinitions()[indexType]?.[indexName]
  }

  fromDto(wsConnectionDto: WsConnectionDTO): WsConnectionFields {
    const { userId, connectionId, expiresAt, ...remainingData } = wsConnectionDto

    return {
      PK: `${WS_CONNECTION_PK_PREFIX}#${userId}`,
      SK: connectionId,
      ...remainingData,
      expiresAt: connectionExpiresAt()
    }
  }

  toDto(dbFields: WsConnectionFields): WsConnectionDTO {
    const { PK, SK, ...remainingFields } = dbFields

    return {
      ...remainingFields,
      userId: PK.replace(`${WS_CONNECTION_PK_PREFIX}#`, ''),
      connectionId: SK
    }
  }
}
