import DynamoDbTableOperations from './DynamoDbTableOperations'
import type {
  QueryInput
} from '../../../../application/models/policies/repositories/QueryTypes';
import {
  QueryConditionOperator
} from '../../../../application/models/policies/repositories/QueryTypes'
import type {
  AcceptDonationFields
} from '../ddbModels/AcceptDonationModel';
import {
  AcceptDonationRequestModel
} from '../ddbModels/AcceptDonationModel';
import {
  ACCEPTED_DONATION_PK_PREFIX,
  ACCEPTED_DONATION_SK_PREFIX
} from '../ddbModels/AcceptDonationModel'
import type { AcceptDonationDTO } from 'commons/dto/DonationDTO';
import type AcceptDonationRepository from '../../../../application/models/policies/repositories/AcceptDonationRepository';

export default class AcceptDonationDynamoDbOperations extends DynamoDbTableOperations<
  AcceptDonationDTO,
  AcceptDonationFields,
  AcceptDonationRequestModel
> implements AcceptDonationRepository {
  constructor(tableName: string, region: string) {
    super(new AcceptDonationRequestModel(), tableName, region)
  }

  async getAcceptedRequest(
    seekerId: string,
    requestPostId: string,
    donorId: string
  ): Promise<AcceptDonationDTO | null> {
    const item = await super.getItem(
      `${ACCEPTED_DONATION_PK_PREFIX}#${seekerId}`,
      `${ACCEPTED_DONATION_SK_PREFIX}#${requestPostId}#${donorId}`
    )
    return item
  }

  async queryAcceptedRequests(seekerId: string, requestPostId: string): Promise<AcceptDonationDTO[] | null> {
    const primaryIndex = this.modelAdapter.getPrimaryIndex()
    const query: QueryInput<AcceptDonationFields> = {
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
