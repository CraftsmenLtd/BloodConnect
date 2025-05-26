import DynamoDbTableOperations from './DynamoDbTableOperations'
import type { DonationFields } from '../ddbModels/BloodDonationModel'
import { BloodDonationModel } from '../ddbModels/BloodDonationModel'
import { BLOOD_REQUEST_PK_PREFIX } from '../ddbModels/BloodDonationModel'
import type { DonationDTO } from 'commons/dto/DonationDTO'
import type BloodDonationRepository from '../../../../application/models/policies/repositories/BloodDonationRepository'
import { QueryConditionOperator, type QueryInput } from '../../../../application/models/policies/repositories/QueryTypes'

export default class BloodDonationDynamoDbOperations extends DynamoDbTableOperations<
  DonationDTO,
  DonationFields,
  BloodDonationModel
> implements BloodDonationRepository {
  constructor(tableName: string, region: string) {
    super(new BloodDonationModel(), tableName, region)
  }

  async getDonationRequest(
    seekerId: string,
    requestPostId: string,
    createdAt: string
  ): Promise<DonationDTO | null> {
    const item = await super.getItem(
      `${BLOOD_REQUEST_PK_PREFIX}#${seekerId}`,
      `${BLOOD_REQUEST_PK_PREFIX}#${createdAt}#${requestPostId}`
    )
    return item
  }

  async getDonationRequestsByDate(seekerId: string, datePrefix: string): Promise<DonationDTO[]> {
    const primaryIndex = this.modelAdapter.getPrimaryIndex()

    const query: QueryInput<DonationFields> = {
      partitionKeyCondition: {
        attributeName: primaryIndex.partitionKey,
        operator: QueryConditionOperator.EQUALS,
        attributeValue: `${BLOOD_REQUEST_PK_PREFIX}#${seekerId}`
      }
    }

    if (primaryIndex.sortKey !== undefined) {
      query.sortKeyCondition = {
        attributeName: primaryIndex.sortKey,
        operator: QueryConditionOperator.BEGINS_WITH,
        attributeValue: `${BLOOD_REQUEST_PK_PREFIX}#${datePrefix}`
      }
    }
    const queryResult = await super.query(query)
    return queryResult.items
  }
}
