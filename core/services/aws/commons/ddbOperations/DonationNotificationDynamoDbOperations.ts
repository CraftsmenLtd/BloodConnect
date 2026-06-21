import DynamoDbTableOperations from './DynamoDbTableOperations'
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb'
import { PutCommand } from '@aws-sdk/lib-dynamodb'
import type {
  QueryInput
} from '../../../../application/models/policies/repositories/QueryTypes'
import {
  QueryConditionOperator
} from '../../../../application/models/policies/repositories/QueryTypes'
import { NOTIFICATION_PK_PREFIX } from '../ddbModels/NotificationModel'
import DonationNotificationModel from '../ddbModels/DonationNotificationModel'
import type { DonationNotificationFields } from '../ddbModels/DonationNotificationModel'
import type NotificationRepository from '../../../../application/models/policies/repositories/NotificationRepository'
import type { DonationNotificationDTO, NotificationDTO } from 'commons/dto/NotificationDTO'

export default class DonationNotificationDynamoDbOperations extends DynamoDbTableOperations<
  NotificationDTO | DonationNotificationDTO,
  DonationNotificationFields,
  DonationNotificationModel
> implements NotificationRepository {
  constructor(tableName: string, region: string) {
    super(new DonationNotificationModel(), tableName, region)
  }

  async create(
    item: NotificationDTO | DonationNotificationDTO
  ): Promise<NotificationDTO | DonationNotificationDTO> {
    const dbItem = this.modelAdapter.fromDto(item)
    try {
      await this.client.send(new PutCommand({
        TableName: this.tableName,
        Item: dbItem,
        ConditionExpression: 'attribute_not_exists(PK)'
      }))
    } catch (error) {
      if (!(error instanceof ConditionalCheckFailedException)) {
        throw error
      }
    }

    return this.modelAdapter.toDto(dbItem)
  }

  async queryBloodDonationNotifications(
    requestPostId: string,
    status?: string
  ): Promise<(NotificationDTO | DonationNotificationDTO)[]> {
    const gsiIndex = this.modelAdapter.getIndex('GSI', 'GSI1')
    if (gsiIndex === undefined) {
      throw new Error('Index not found.')
    }

    const query: QueryInput<DonationNotificationFields> = {
      partitionKeyCondition: {
        attributeName: gsiIndex.partitionKey,
        operator: QueryConditionOperator.EQUALS,
        attributeValue: requestPostId
      }
    }

    if (gsiIndex.sortKey !== undefined && status !== undefined) {
      query.sortKeyCondition = {
        attributeName: gsiIndex.sortKey,
        operator: QueryConditionOperator.BEGINS_WITH,
        attributeValue: `${NOTIFICATION_PK_PREFIX}#${status}`
      }
    }

    const queryResult = await super.query(
      query as QueryInput<Record<string, unknown>>,
      'GSI1'
    )

    return queryResult.items
  }

  async getBloodDonationNotification(
    userId: string,
    requestPostId: string,
    type: string
  ): Promise<(NotificationDTO | DonationNotificationDTO) | null> {
    const item = await super.getItem(`${NOTIFICATION_PK_PREFIX}#${userId}`, `${type}#${requestPostId}`)

    return item
  }
}
