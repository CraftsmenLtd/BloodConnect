import { NotificationDTO } from '../../../../commons/dto/NotificationDTO'
import { DbIndex, DbModelDtoAdapter, HasTimeLog, IndexDefinitions, IndexType, NosqlModel } from './DbModelDefinitions'

export type NotificationFields = Omit<NotificationDTO, 'id' | 'userId' | 'type'> & HasTimeLog & {
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
    const { id, userId, type, data, ...remainingNotificationFields } = notificationDto
    if (type === 'bloodRequestPost' && data !== undefined && data.requestPostId !== undefined) {
      return {
        PK: `NOTIFICATION#${userId}`,
        SK: `BLOODREQPOST#${data.requestPostId}`,
        ...remainingNotificationFields,
        data,
        createdAt: new Date().toISOString()
      }
    }

    return {
      PK: `NOTIFICATION#${userId}`,
      SK: `COMMON#${id}`,
      ...remainingNotificationFields,
      data,
      createdAt: new Date().toISOString()
    }
  }

  toDto(dbFields: NotificationFields): NotificationDTO {
    const { PK, SK, ...remainingNotificationFields } = dbFields
    const userId = PK.replace('NOTIFICATION#', '')
    if (SK.startsWith('BLOODREQPOST#')) {
      const parts = SK.split('#')
      return {
        ...remainingNotificationFields,
        userId,
        type: 'bloodRequestPost',
        id: parts[2]
      }
    }

    return {
      ...remainingNotificationFields,
      userId,
      type: 'common',
      id: SK.replace('COMMON#', '')
    }
  }
}
