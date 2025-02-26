import { BloodDonationNotificationDTO, NotificationType } from '../../../../commons/dto/NotificationDTO'
import { DbIndex, DbModelDtoAdapter, HasTimeLog, IndexDefinitions, IndexType, NosqlModel } from './DbModelDefinitions'
import { NOTIFICATION_PK_PREFIX } from './NotificationModel'

export type BloodDonationNotificationFields = Omit<BloodDonationNotificationDTO, 'id' | 'userId' | 'type'> & HasTimeLog & {
  PK: `${typeof NOTIFICATION_PK_PREFIX}#${string}`;
  SK: `${string}`;
  GSI1PK?: `${string}`;
  GSI1SK?: `${typeof NOTIFICATION_PK_PREFIX}#${string}#${string}`;
  LSI1SK?: `STATUS#${string}#${string}`;
}

export default class DonationNotificationModel implements NosqlModel<BloodDonationNotificationFields>, DbModelDtoAdapter<BloodDonationNotificationDTO, BloodDonationNotificationFields> {
  getIndexDefinitions(): IndexDefinitions<BloodDonationNotificationFields> {
    return {
      GSI: {
        GSI1: {
          partitionKey: 'GSI1PK',
          sortKey: 'GSI1SK'
        }
      }
    }
  }

  getPrimaryIndex(): DbIndex<BloodDonationNotificationFields> {
    return { partitionKey: 'PK', sortKey: 'SK' }
  }

  getIndex(indexType: IndexType, indexName: string): DbIndex<BloodDonationNotificationFields> | undefined {
    return this.getIndexDefinitions()[indexType]?.[indexName]
  }

  fromDto(BloodDonationNotificationDTO: BloodDonationNotificationDTO): BloodDonationNotificationFields {
    const { id, userId, type, ...remainingNotificationFields } = BloodDonationNotificationDTO

    const data: BloodDonationNotificationFields = {
      PK: `${NOTIFICATION_PK_PREFIX}#${userId}`,
      SK: `${type}#${id}`,
      ...remainingNotificationFields
    }

    if ([NotificationType.BLOOD_REQ_POST, NotificationType.REQ_ACCEPTED].includes(type)) {
      data.GSI1PK = `${id}`
      data.GSI1SK = `${NOTIFICATION_PK_PREFIX}#${remainingNotificationFields.status}#${userId}`
    }
    if (remainingNotificationFields.status !== undefined) {
      data.LSI1SK = `STATUS#${remainingNotificationFields.status}#${id}`
    }
    return data
  }

  toDto(dbFields: BloodDonationNotificationFields): BloodDonationNotificationDTO {
    const { PK, SK, GSI1PK, GSI1SK, LSI1SK, ...remainingBloodDonationNotificationFields } = dbFields
    const userId = PK.replace(`${NOTIFICATION_PK_PREFIX}#`, '')
    return {
      ...remainingBloodDonationNotificationFields,
      userId,
      type: SK.split('#')[0] as NotificationType,
      id: SK.split('#')[1]
    }
  }
}
