import DynamoDbTableOperations from './DynamoDbTableOperations'
import type { DTO } from '../../../../../commons/dto/DTOCommon'
import type {
  NosqlModel,
  DbModelDtoAdapter
} from '../../../../application/models/dbModels/DbModelDefinitions'
import type {
  QueryInput
} from '../../../../application/models/policies/repositories/QueryTypes';
import {
  QueryConditionOperator
} from '../../../../application/models/policies/repositories/QueryTypes'

export default class GeohashDynamoDbOperations<
  Dto extends DTO,
  DbFields extends Record<string, unknown>,
  ModelAdapter extends NosqlModel<DbFields> & DbModelDtoAdapter<Dto, DbFields>
> extends DynamoDbTableOperations<Dto, DbFields, ModelAdapter> {
  async queryGeohash (
    countryCode: string,
    geoPartition: string,
    requestedBloodGroup: string,
    geohash: string,
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
        attributeValue: `LOCATION#${countryCode}-${geoPartition}#BG#${requestedBloodGroup}#DONATIONSTATUS#true`
      },
      options: {
        exclusiveStartKey: lastEvaluatedKey
      }
    }

    if (gsiIndex.sortKey !== null && geohash.length > 0) {
      query.sortKeyCondition = {
        attributeName: gsiIndex.sortKey as keyof DbFields,
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
