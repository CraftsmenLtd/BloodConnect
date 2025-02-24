import DynamoDbTableOperations from './DynamoDbTableOperations'
import { DTO } from '../../../../../commons/dto/DTOCommon'
import {
  NosqlModel,
  DbModelDtoAdapter
} from '../../../../application/models/dbModels/DbModelDefinitions'
import {
  QueryConditionOperator,
  QueryInput
} from '../../../../application/models/policies/repositories/QueryTypes'
import { NOTIFICATION_PK_PREFIX } from '../../../../application/models/dbModels/NotificationModel'

export default class NotificationDynamoDbOperations<
  Dto extends DTO,
  DbFields extends Record<string, unknown>,
  ModelAdapter extends NosqlModel<DbFields> & DbModelDtoAdapter<Dto, DbFields>
> extends DynamoDbTableOperations<Dto, DbFields, ModelAdapter> {
  async queryBloodDonationNotifications(
    requestPostId: string,
    status?: string
  ): Promise<Dto[]> {
    const gsiIndex = this.modelAdapter.getIndex('GSI', 'GSI1')
    if (gsiIndex === undefined) {
      throw new Error('Index not found.')
    }

    const query: QueryInput<DbFields> = {
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
  ): Promise<Dto | null> {
    const item = await super.getItem(`${NOTIFICATION_PK_PREFIX}#${userId}`, `${type}#${requestPostId}`)
    return item
  }
}
