import { NotificationDTO, NotificationType } from '../../../../commons/dto/NotificationDTO'
import { DbIndex, DbModelDtoAdapter, HasTimeLog, IndexDefinitions, IndexType, NosqlModel } from './DbModelDefinitions'

export const NOTIFICATION_PK_PREFIX = 'NOTIFICATION'

export type NotificationFields = Omit<NotificationDTO, 'id' | 'userId' | 'type'> & HasTimeLog & {
  PK: `${typeof NOTIFICATION_PK_PREFIX}#${string}`;
  SK: `${string}`;
  GSI1PK?: `${string}`;
  GSI1SK?: `${typeof NOTIFICATION_PK_PREFIX}#${string}`;
  LSI1SK?: `STATUS#${string}#${string}`;
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

    if (['BLOOD_REQ_POST', 'REQ_ACCEPTED'].includes(type)) {
      return {
        PK: `${NOTIFICATION_PK_PREFIX}#${userId}`,
        SK: `${type}#${id}`,
        GSI1PK: `${id}`,
        GSI1SK: `${NOTIFICATION_PK_PREFIX}#${userId}`,
        LSI1SK: `STATUS#${remainingNotificationFields.status}#${id}`,
        ...remainingNotificationFields,
        payload
      }
    }
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
    const parts = SK.split('#')
    return {
      ...remainingNotificationFields,
      userId,
      type: parts[1] as NotificationType,
      id: parts[2]
    }
  }
}
