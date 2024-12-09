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

export default class NotificationDynamoDbOperations<
  Dto extends DTO,
  DbFields extends Record<string, unknown>,
  ModelAdapter extends NosqlModel<DbFields> & DbModelDtoAdapter<Dto, DbFields>
> extends DynamoDbTableOperations<Dto, DbFields, ModelAdapter> {
  async queryBloodDonationNotifications(
    requestPostId: string
  ): Promise<Dto[] | null> {
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
    const item = await super.getItem(`NOTIFICATION#${userId}`, `${type}#${requestPostId}`)
    return item
  }
}
