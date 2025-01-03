import DynamoDbTableOperations from './DynamoDbTableOperations'
import { DTO } from '../../../../../commons/dto/DTOCommon'
import {
  NosqlModel,
  DbModelDtoAdapter
} from '../../../../application/models/dbModels/DbModelDefinitions'
import { BLOOD_REQUEST_PK_PREFIX } from '../../../../application/models/dbModels/BloodDonationModel'
import {
  QueryConditionOperator,
  QueryInput
} from '../../../../application/models/policies/repositories/QueryTypes'

export default class BloodDonationDynamoDbOperations<
  Dto extends DTO,
  DbFields extends Record<string, unknown>,
  ModelAdapter extends NosqlModel<DbFields> & DbModelDtoAdapter<Dto, DbFields>
> extends DynamoDbTableOperations<Dto, DbFields, ModelAdapter> {
  async getDonationRequest(
    seekerId: string,
    requestPostId: string,
    createdAt: string
  ): Promise<Dto | null> {
    const item = await super.getItem(
      `${BLOOD_REQUEST_PK_PREFIX}#${seekerId}`,
      `${BLOOD_REQUEST_PK_PREFIX}#${createdAt}#${requestPostId}`
    )
    return item
  }

  async queryPublicDonations(
    city: string,
    lastEvaluatedKey: Record<string, unknown> | undefined
  ): Promise<{ items: Dto[]; lastEvaluatedKey?: Record<string, unknown> }> {
    const gsiIndex = this.modelAdapter.getIndex('GSI', 'GSI1')
    if (gsiIndex === undefined) {
      throw new Error('Index not found.')
    }

    const query: QueryInput<DbFields> = {
      partitionKeyCondition: {
        attributeName: gsiIndex.partitionKey,
        operator: QueryConditionOperator.EQUALS,
        attributeValue: `CITY#${city}#STATUS#PENDING`
      },
      options: {
        exclusiveStartKey: lastEvaluatedKey,
        scanIndexForward: false
      }
    }

    const requestedAttributes = [
      'PK',
      'SK',
      'seekerName',
      'patientName',
      'createdAt',
      'requestedBloodGroup',
      'bloodQuantity',
      'urgencyLevel',
      'city',
      'location',
      'donationDateTime',
      'status',
      'contactNumber',
      'shortDescription',
      'transportationInfo'
    ]
    const queryResult = await super.query(
      query as QueryInput<Record<string, unknown>>,
      'GSI1',
      requestedAttributes
    )
    return queryResult
  }
}
