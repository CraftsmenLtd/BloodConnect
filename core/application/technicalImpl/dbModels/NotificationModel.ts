import { NotificationDTO } from '../../../../commons/dto/NotificationDTO'
import { DbIndex, DbModelDtoAdapter, HasTimeLog, IndexDefinitions, IndexType, NosqlModel } from './DbModelDefinitions'

export type NotificationFields = Omit<NotificationDTO, 'id' | 'userId' | 'type' | 'requestPostId'> & HasTimeLog & {
  PK: `NOTIFICATION#${string}`;
  SK: `${string}`;
}

export default class NotificationModel implements NosqlModel<NotificationFields>, DbModelDtoAdapter<NotificationDTO, NotificationFields> {
  getIndexDefinitions(): IndexDefinitions<NotificationFields> {
    return {}
  }

  getPrimaryIndex(): DbIndex<NotificationFields> {
    return { partitionKey: 'PK', sortKey: 'SK' }
  }

  getIndex(indexType: IndexType, indexName: string): DbIndex<NotificationFields> | undefined {
    return this.getIndexDefinitions()[indexType]?.[indexName]
  }

  fromDto(notificationDto: NotificationDTO): NotificationFields {
    const { id, userId, type, requestPostId, ...remainingNotificationFields } = notificationDto
    let sk = `COMMON#${id}`
    if (type === 'bloodRequestPost') {
      sk = `BLOODREQPOST#${requestPostId}`
    }

    return {
      PK: `NOTIFICATION#${userId}`,
      SK: sk,
      ...remainingNotificationFields,
      createdAt: new Date().toISOString()
    }
  }

  toDto(dbFields: NotificationFields): NotificationDTO {
    const { PK, SK, ...remainingNotificationFields } = dbFields
    const userId = PK.replace('NOTIFICATION#', '')
    let requestPostId: string | undefined
    let type = 'common'
    let id = ''
    if (SK.startsWith('BLOODREQPOST#')) {
      const parts = SK.split('#')
      requestPostId = parts[1]
      id = parts[2]
      type = 'bloodRequestPost'
    } else if (SK.startsWith('COMMON#')) {
      id = SK.replace('COMMON#', '')
    }

    return {
      ...remainingNotificationFields,
      userId,
      requestPostId,
      type,
      id
    }
  }
}
