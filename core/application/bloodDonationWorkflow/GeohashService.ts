import { getGeohashNthNeighbors } from '../utils/geohash'
import type { LocationDTO } from '../../../commons/dto/UserDTO'
import type GeohashRepository from '../models/policies/repositories/GeohashRepository'
import { GEO_PARTITION_PREFIX_LENGTH } from '../../../commons/libs/constants/NoMagicNumbers'
import type { Logger } from '../models/logger/Logger'
import type { DonorSearchConfig } from './Types'

export class GeohashService {
  constructor(
    protected readonly geohashRepository: GeohashRepository,
    protected readonly logger: Logger,
    protected readonly options: DonorSearchConfig
  ) { }

  async queryGeohash(
    countryCode: string,
    requestedBloodGroup: string,
    geohash: string,
    lastEvaluatedKey: Record<string, unknown> | undefined = undefined,
    foundDonors: LocationDTO[] = []
  ): Promise<LocationDTO[]> {
    const geoPartition = geohash.slice(0, GEO_PARTITION_PREFIX_LENGTH)
    const queryResult = await this.geohashRepository.queryGeohash(
      countryCode,
      geoPartition,
      requestedBloodGroup,
      geohash,
      lastEvaluatedKey
    )
    const updatedDonors = [...foundDonors, ...(queryResult.items ?? [])]
    const nextLastEvaluatedKey = queryResult.lastEvaluatedKey

    return nextLastEvaluatedKey !== null
      ? this.queryGeohash(
        countryCode,
        requestedBloodGroup,
        geohash,
        nextLastEvaluatedKey,
        updatedDonors
      )
      : updatedDonors
  }

  getNeighborGeohashes = (
    geohash: string,
    neighborLevel: number,
    currentGeohashes: string[] = []
  ): { updatedGeohashesToProcess: string[]; updatedNeighborSearchLevel: number } => {
    if (
      currentGeohashes.length >= this.options.maxGeohashesPerExecution
      || neighborLevel >= this.options.maxGeohashNeighborSearchLevel
    ) {
      return {
        updatedGeohashesToProcess: currentGeohashes,
        updatedNeighborSearchLevel: neighborLevel
      }
    }

    const newNeighborLevel = neighborLevel + 1
    const newGeohashes = getGeohashNthNeighbors(geohash, newNeighborLevel)
    const updatedGeohashes = [...currentGeohashes, ...newGeohashes]

    return this.getNeighborGeohashes(geohash, newNeighborLevel, updatedGeohashes)
  }
}
