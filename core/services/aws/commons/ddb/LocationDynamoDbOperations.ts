import DynamoDbTableOperations from './DynamoDbTableOperations'
import {
  QueryConditionOperator,
  QueryInput
} from '../../../../application/models/policies/repositories/QueryTypes'
import { LocationDTO } from 'commons/dto/UserDTO'
import LocationModel, { LocationFields } from 'core/application/models/dbModels/LocationModel'

export default class LocationDynamoDbOperations extends DynamoDbTableOperations<
LocationDTO,
LocationFields,
LocationModel
> {
  async deleteUserLocations(userId: string): Promise<void> {
    const primaryIndex = this.modelAdapter.getPrimaryIndex()
    const query: QueryInput<LocationFields> = {
      partitionKeyCondition: {
        attributeName: primaryIndex.partitionKey,
        operator: QueryConditionOperator.EQUALS,
        attributeValue: `USER#${userId}`
      }
    }

    if (primaryIndex.sortKey !== undefined) {
      query.sortKeyCondition = {
        attributeName: primaryIndex.sortKey,
        operator: QueryConditionOperator.BEGINS_WITH,
        attributeValue: 'LOCATION#'
      }
    }

    const existingLocations = await super.query(query as QueryInput<Record<string, unknown>>)
    for (const location of existingLocations.items) {
      await super.delete(`USER#${userId}`, `LOCATION#${location.locationId}`)
    }
  }
}
