import DynamoDbTableOperations from './DynamoDbTableOperations'
import type {
  QueryInput
} from '../../../../application/models/policies/repositories/QueryTypes';
import {
  QueryConditionOperator
} from '../../../../application/models/policies/repositories/QueryTypes'
import type { LocationDTO } from 'commons/dto/UserDTO'
import type { LocationFields } from '../ddbModels/LocationModel';
import LocationModel from '../ddbModels/LocationModel'

export default class LocationDynamoDbOperations extends DynamoDbTableOperations<
  LocationDTO,
  LocationFields,
  LocationModel
> {
  constructor(tableName: string, region: string) {
    super(new LocationModel(), tableName, region)
  }

  async queryUserLocations(userId: string): Promise<LocationDTO[]> {
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
    const queryResult = await super.query(query as QueryInput<Record<string, unknown>>)
    return queryResult.items
  }

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
