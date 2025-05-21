import DynamoDbTableOperations from './DynamoDbTableOperations'
import type {
  QueryInput
} from '../../../../application/models/policies/repositories/QueryTypes'
import {
  QueryConditionOperator
} from '../../../../application/models/policies/repositories/QueryTypes'
import type { LocationDTO } from 'commons/dto/UserDTO'
import type GeohashRepository from 'core/application/models/policies/repositories/GeohashRepository'
import type { LocationFields } from '../ddbModels/LocationModel'
import LocationModel from '../ddbModels/LocationModel'

export default class GeohashDynamoDbOperations extends DynamoDbTableOperations<
  LocationDTO,
  LocationFields,
  LocationModel
> implements GeohashRepository {
  constructor(tableName: string, region: string) {
    super(new LocationModel(), tableName, region)
  }

  async queryGeohash(
    countryCode: string,
    geoPartition: string,
    requestedBloodGroup: string,
    geohash: string,
    lastEvaluatedKey: Record<string, unknown> | undefined
  ): Promise<{ items: LocationDTO[]; lastEvaluatedKey?: Record<string, unknown> }> {
    const gsiIndex = this.modelAdapter.getIndex('GSI', 'GSI1')
    if (gsiIndex === undefined) {
      throw new Error('Index not found.')
    }

    const query: QueryInput<LocationFields> = {
      partitionKeyCondition: {
        attributeName: gsiIndex.partitionKey,
        operator: QueryConditionOperator.EQUALS,
        attributeValue: `LOCATION#${countryCode}-${geoPartition}#BG#${requestedBloodGroup}#DONATIONSTATUS#true`
      },
      options: {
        exclusiveStartKey: lastEvaluatedKey
      }
    }

    if (gsiIndex.sortKey !== null && geohash.length > 0) {
      query.sortKeyCondition = {
        attributeName: gsiIndex.sortKey as keyof LocationFields,
        operator: QueryConditionOperator.BEGINS_WITH,
        attributeValue: geohash
      }
    }

    const requestedAttributes = ['PK', 'SK', 'GSI1PK', 'GSI1SK']
    const queryResult = await super.query(
      query as QueryInput<Record<string, unknown>>,
      'GSI1',
      requestedAttributes
    )

    return queryResult
  }
}
