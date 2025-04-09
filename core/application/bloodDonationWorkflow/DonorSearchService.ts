import type { DonorSearchDTO } from '../../../commons/dto/DonationDTO'
import type Repository from '../models/policies/repositories/Repository'
import { getGeohashNthNeighbors } from '../utils/geohash'
import type { DonorSearchAttributes, DonorSearchQueueAttributes } from './Types'
import { DONOR_SEARCH_PK_PREFIX } from '../models/dbModels/DonorSearchModel'
import type { LocationDTO } from '../../../commons/dto/UserDTO'
import type GeohashRepository from '../models/policies/repositories/GeohashRepository'
import type { QueueModel } from '../models/queue/QueueModel'
import { GEO_PARTITION_PREFIX_LENGTH } from '../../../commons/libs/constants/NoMagicNumbers'

const DONOR_SEARCH_QUEUE_URL = process.env.DONOR_SEARCH_QUEUE_URL as string

export class DonorSearchService {
  async enqueueDonorSearchRequest(
    donorSearchQueueAttributes: DonorSearchQueueAttributes,
    queueModel: QueueModel,
    delayPeriod?: number
  ): Promise<void> {
    await queueModel.queue(
      donorSearchQueueAttributes,
      DONOR_SEARCH_QUEUE_URL,
      delayPeriod
    )
  }

  async updateVisibilityTimeout(
    receiptHandle: string,
    visibilityTimeout: number,
    queueModel: QueueModel
  ): Promise<void> {
    await queueModel.updateVisibilityTimeout(
      receiptHandle,
      DONOR_SEARCH_QUEUE_URL,
      visibilityTimeout
    )
  }

  async getDonorSearchRecord(
    seekerId: string,
    requestPostId: string,
    createdAt: string,
    donorSearchRepository: Repository<DonorSearchDTO, Record<string, unknown>>
  ): Promise<DonorSearchDTO | null> {
    return donorSearchRepository.getItem(
      `${DONOR_SEARCH_PK_PREFIX}#${seekerId}`,
      `${DONOR_SEARCH_PK_PREFIX}#${createdAt}#${requestPostId}`
    )
  }

  async createDonorSearchRecord(
    donorSearchAttributes: DonorSearchAttributes,
    donorSearchRepository: Repository<DonorSearchDTO, Record<string, unknown>>
  ): Promise<void> {
    await donorSearchRepository.create(donorSearchAttributes)
  }

  async updateDonorSearchRecord(
    donorSearchAttributes: Partial<DonorSearchAttributes>,
    donorSearchRepository: Repository<DonorSearchDTO, Record<string, unknown>>
  ): Promise<void> {
    await donorSearchRepository.update(donorSearchAttributes)
  }

  async getDonorSearch(
    seekerId: string,
    createdAt: string,
    requestPostId: string,
    donorSearchRepository: Repository<DonorSearchDTO>
  ): Promise<DonorSearchDTO> {
    const donorSearchRecord = await donorSearchRepository.getItem(
      `${DONOR_SEARCH_PK_PREFIX}#${seekerId}`,
      `${DONOR_SEARCH_PK_PREFIX}#${createdAt}#${requestPostId}`
    )
    if (donorSearchRecord === null) {
      throw new Error('Donor search record not found.')
    }
    return donorSearchRecord
  }

  async queryGeohash(
    countryCode: string,
    requestedBloodGroup: string,
    geohash: string,
    geohashRepository: GeohashRepository<LocationDTO, Record<string, unknown>>,
    lastEvaluatedKey: Record<string, unknown> | undefined = undefined,
    foundDonors: LocationDTO[] = []
  ): Promise<LocationDTO[]> {
    const geoPartition = geohash.slice(0, GEO_PARTITION_PREFIX_LENGTH)
    const queryResult = await geohashRepository.queryGeohash(
      countryCode,
      geoPartition,
      requestedBloodGroup,
      geohash,
      lastEvaluatedKey
    )
    const updatedDonors = [...foundDonors, ...(queryResult.items ?? [])]
    const nextLastEvaluatedKey = queryResult.lastEvaluatedKey

    return nextLastEvaluatedKey != null
      ? this.queryGeohash(
        countryCode,
        requestedBloodGroup,
        geohash,
        geohashRepository,
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
      currentGeohashes.length >= Number(process.env.MAX_GEOHASHES_PER_EXECUTION) ||
      neighborLevel >= Number(process.env.MAX_GEOHASH_NEIGHBOR_SEARCH_LEVEL)
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
