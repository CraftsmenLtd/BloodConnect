import type { LocationDTO } from 'commons/dto/UserDTO';
import type Repository from './Repository'

type GeohashRepository = {
  queryGeohash(
    countryCode: string,
    geoPartition: string,
    requestedBloodGroup: string,
    geohash: string,
    lastEvaluatedKey: Record<string, unknown> | undefined
  ): Promise<{ items: LocationDTO[]; lastEvaluatedKey?: Record<string, unknown> }>;
} & Repository<LocationDTO, Record<string, unknown>>
export default GeohashRepository
