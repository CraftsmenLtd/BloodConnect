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
import {
  ACCEPTED_DONATION_PK_PREFIX,
  ACCEPTED_DONATION_SK_PREFIX
} from '../../../../application/models/dbModels/AcceptDonationModel'

export default class AcceptedDonationDynamoDbOperations<
  Dto extends DTO,
  DbFields extends Record<string, unknown>,
  ModelAdapter extends NosqlModel<DbFields> & DbModelDtoAdapter<Dto, DbFields>
> extends DynamoDbTableOperations<Dto, DbFields, ModelAdapter> {
  async getAcceptedRequest(
    seekerId: string,
    requestPostId: string,
    donorId: string
  ): Promise<Dto | null> {
    const item = await super.getItem(
      `${ACCEPTED_DONATION_PK_PREFIX}#${seekerId}`,
      `${ACCEPTED_DONATION_SK_PREFIX}#${requestPostId}#${donorId}`
    )
    return item
  }

  async queryAcceptedRequests(seekerId: string, requestPostId: string): Promise<Dto[] | null> {
    const primaryIndex = this.modelAdapter.getPrimaryIndex()
    const query: QueryInput<DbFields> = {
      partitionKeyCondition: {
        attributeName: primaryIndex.partitionKey,
        operator: QueryConditionOperator.EQUALS,
        attributeValue: `${ACCEPTED_DONATION_PK_PREFIX}#${seekerId}`
      }
    }

    if (primaryIndex.sortKey !== undefined) {
      query.sortKeyCondition = {
        attributeName: primaryIndex.sortKey,
        operator: QueryConditionOperator.BEGINS_WITH,
        attributeValue: `${ACCEPTED_DONATION_SK_PREFIX}#${requestPostId}`
      }
    }
    const queryResult = await super.query(query as QueryInput<Record<string, unknown>>)
    return queryResult.items
  }

  async deleteAcceptedRequest(
    seekerId: string,
    requestPostId: string,
    donorId: string
  ): Promise<void> {
    await super.delete(
      `${ACCEPTED_DONATION_PK_PREFIX}#${seekerId}`,
      `${ACCEPTED_DONATION_SK_PREFIX}#${requestPostId}#${donorId}`
    )
  }
}
