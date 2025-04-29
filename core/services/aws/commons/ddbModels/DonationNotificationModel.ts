import type {
  DonationNotificationDTO
} from '../../../../../commons/dto/NotificationDTO';
import { NotificationType } from '../../../../../commons/dto/NotificationDTO'
import type {
  DbIndex,
  DbModelDtoAdapter,
  HasTimeLog,
  IndexDefinitions,
  IndexType,
  NosqlModel
} from './DbModelDefinitions'
import { NOTIFICATION_PK_PREFIX } from './NotificationModel'

export type DonationNotificationFields = Omit<
  DonationNotificationDTO,
  'id' |
  'userId' |
  'type'
> & HasTimeLog & {
  PK: `${typeof NOTIFICATION_PK_PREFIX}#${string}`;
  SK: `${string}`;
  GSI1PK?: `${string}`;
  GSI1SK?: `${typeof NOTIFICATION_PK_PREFIX}#${string}#${string}`;
  LSI1SK?: `STATUS#${string}#${string}`;
}

export default class DonationNotificationModel implements
  NosqlModel<DonationNotificationFields>,
  DbModelDtoAdapter<
    DonationNotificationDTO,
    DonationNotificationFields
  >
{
  getIndexDefinitions(): IndexDefinitions<DonationNotificationFields> {
    return {
      GSI: {
        GSI1: {
          partitionKey: 'GSI1PK',
          sortKey: 'GSI1SK'
        }
      }
    }
  }

  getPrimaryIndex(): DbIndex<DonationNotificationFields> {
    return { partitionKey: 'PK', sortKey: 'SK' }
  }

  getIndex(
    indexType: IndexType,
    indexName: string
  ): DbIndex<DonationNotificationFields> | undefined {
    return this.getIndexDefinitions()[indexType]?.[indexName]
  }

  fromDto(
    DonationNotificationDTO: DonationNotificationDTO
  ): DonationNotificationFields {
    const { id, userId, type, ...remainingNotificationFields } = DonationNotificationDTO

    const data: DonationNotificationFields = {
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

  toDto(dbFields: DonationNotificationFields): DonationNotificationDTO {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { PK, SK, GSI1PK, GSI1SK, LSI1SK, ...remainingDonationNotificationFields } = dbFields
    const userId = PK.replace(`${NOTIFICATION_PK_PREFIX}#`, '')
    return {
      ...remainingDonationNotificationFields,
      userId,
      type: SK.split('#')[0] as NotificationType,
      id: SK.split('#')[1]
    }
  }
}
