import DynamoDbTableOperations from './DynamoDbTableOperations'
import type {
  QueryInput
} from '../../../../application/models/policies/repositories/QueryTypes'
import {
  QueryConditionOperator
} from '../../../../application/models/policies/repositories/QueryTypes'
import type { LocationDTO } from 'commons/dto/UserDTO'
import type H3SearchRepository from 'core/application/models/policies/repositories/H3SearchRepository'
import type { DonorInHexResult } from 'core/application/models/policies/repositories/H3SearchRepository'
import type { LocationFields } from '../ddbModels/LocationModel'
import LocationModel from '../ddbModels/LocationModel'

const PROJECTED_ATTRIBUTES = [
  'PK',
  'SK',
  'GSI1PK',
  'GSI1SK',
  'h3Res8',
  'h3Res10',
  'latitude',
  'longitude',
  'displayName',
  'phoneE164'
]

export default class H3SearchDynamoDbOperations extends DynamoDbTableOperations<
  LocationDTO,
  LocationFields,
  LocationModel
> implements H3SearchRepository {
  constructor(tableName: string, region: string) {
    super(new LocationModel(), tableName, region)
  }

  async queryDonorsInHex(
    countryCode: string,
    bloodGroup: string,
    h3Res8Cell: string,
    limit: number
  ): Promise<DonorInHexResult[]> {
    const gsiIndex = this.modelAdapter.getIndex('GSI', 'GSI1')
    if (gsiIndex === undefined) {
      throw new Error('Index not found.')
    }

    const query: QueryInput<LocationFields> = {
      partitionKeyCondition: {
        attributeName: gsiIndex.partitionKey,
        operator: QueryConditionOperator.EQUALS,
        attributeValue: `LOC#${countryCode}#${bloodGroup}#AVAIL#${h3Res8Cell}`
      },
      options: {
        limit
      }
    }

    const queryResult = await super.query(
      query as QueryInput<Record<string, unknown>>,
      'GSI1',
      PROJECTED_ATTRIBUTES
    )

    return (queryResult.items ?? []).map((item) => ({
      userId: (item as unknown as { PK?: string; userId?: string }).PK?.replace('USER#', '')
        ?? (item as unknown as { userId?: string }).userId ?? '',
      locationId: (item as unknown as { SK?: string; locationId?: string }).SK?.replace('LOCATION#', '')
        ?? (item as unknown as { locationId?: string }).locationId ?? '',
      h3Res8: (item as unknown as { h3Res8?: string }).h3Res8 ?? '',
      h3Res10: (item as unknown as { h3Res10?: string }).h3Res10,
      latitude: (item as unknown as { latitude?: number }).latitude ?? 0,
      longitude: (item as unknown as { longitude?: number }).longitude ?? 0,
      displayName: (item as unknown as { displayName?: string }).displayName,
      phoneE164: (item as unknown as { phoneE164?: string }).phoneE164
    }))
  }
}
