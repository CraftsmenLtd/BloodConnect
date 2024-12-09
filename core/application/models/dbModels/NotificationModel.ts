import { NotificationDTO, NotificationType } from '../../../../commons/dto/NotificationDTO'
import { DbIndex, DbModelDtoAdapter, HasTimeLog, IndexDefinitions, IndexType, NosqlModel } from './DbModelDefinitions'

export const NOTIFICATION_PK_PREFIX = 'NOTIFICATION'

export type NotificationFields = Omit<NotificationDTO, 'id' | 'userId' | 'type'> & HasTimeLog & {
  PK: `${typeof NOTIFICATION_PK_PREFIX}#${string}`;
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
    const { id, userId, type, payload, ...remainingNotificationFields } = notificationDto
    return {
      PK: `${NOTIFICATION_PK_PREFIX}#${userId}`,
      SK: `${type}#${id}`,
      ...remainingNotificationFields,
      payload
    }
  }

  toDto(dbFields: NotificationFields): NotificationDTO {
    const { PK, SK, ...remainingNotificationFields } = dbFields
    const userId = PK.replace('NOTIFICATION#', '')
    return {
      ...remainingNotificationFields,
      userId,
      type: SK.split('#')[0] as NotificationType,
      id: SK.split('#')[1]
    }
  }
}
