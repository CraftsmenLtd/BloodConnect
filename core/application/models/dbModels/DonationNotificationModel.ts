import { BloodDonationNotificationDTO, NotificationType } from '../../../../commons/dto/NotificationDTO'
import { DbIndex, DbModelDtoAdapter, HasTimeLog, IndexDefinitions, IndexType, NosqlModel } from './DbModelDefinitions'

export const NOTIFICATION_PK_PREFIX = 'NOTIFICATION'

export type BloodDonationNotificationFields = Omit<BloodDonationNotificationDTO, 'id' | 'userId' | 'type'> & HasTimeLog & {
  PK: `${typeof NOTIFICATION_PK_PREFIX}#${string}`;
  SK: `${string}`;
  GSI1PK: `${string}`;
  GSI1SK: `${typeof NOTIFICATION_PK_PREFIX}#${string}`;
  LSI1SK: `STATUS#${string}#${string}`;
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
    const { id, userId, type, payload, ...remainingBloodDonationNotificationFields } = BloodDonationNotificationDTO
    return {
      PK: `${NOTIFICATION_PK_PREFIX}#${userId}`,
      SK: `${type}#${id}`,
      GSI1PK: `${id}`,
      GSI1SK: `${NOTIFICATION_PK_PREFIX}#${userId}`,
      LSI1SK: `STATUS#${remainingBloodDonationNotificationFields.status}#${id}`,
      ...remainingBloodDonationNotificationFields,
      payload
    }
  }

  toDto(dbFields: BloodDonationNotificationFields): BloodDonationNotificationDTO {
    const { PK, SK, GSI1PK, GSI1SK, LSI1SK, ...remainingBloodDonationNotificationFields } = dbFields
    const userId = PK.replace('NOTIFICATION#', '')
    const parts = SK.split('#')
    return {
      ...remainingBloodDonationNotificationFields,
      userId,
      type: parts[0] as NotificationType,
      id: parts[1]
    }
  }
}
