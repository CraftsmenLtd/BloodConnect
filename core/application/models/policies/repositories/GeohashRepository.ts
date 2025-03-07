import { DTO } from '../../../../../commons/dto/DTOCommon'
import Repository from './Repository'

export default interface GeohashRepository<
  T extends DTO,
  DbFields extends Record<string, unknown> = Record<string, unknown>
> extends Repository<T, DbFields> {
  queryGeohash(
    countryCode: string,
    city: string,
    requestedBloodGroup: string,
    geohash: string,
    lastEvaluatedKey: Record<string, unknown> | undefined
  ): Promise<{ items: T[]; lastEvaluatedKey?: Record<string, unknown> }>;
}
