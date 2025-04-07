import type { DTO } from '../../../../../commons/dto/DTOCommon'
import type Repository from './Repository'

type GeohashRepository<
  T extends DTO,
  DbFields extends Record<string, unknown> = Record<string, unknown>
> = {
  queryGeohash(
    countryCode: string,
    geoPartition: string,
    requestedBloodGroup: string,
    geohash: string,
    lastEvaluatedKey: Record<string, unknown> | undefined
  ): Promise<{ items: T[]; lastEvaluatedKey?: Record<string, unknown> }>;
} & Repository<T, DbFields>
export default GeohashRepository
