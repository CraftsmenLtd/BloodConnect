import { DonorSearchService } from '../../../application/bloodDonationWorkflow/DonorSearchService'
import { DonorSearchDTO } from '../../../../commons/dto/DonationDTO'
import { LocationDTO } from '../../../../commons/dto/UserDTO'
import LocationModel, { LocationFields } from '../../../application/models/dbModels/LocationModel'

import DynamoDbTableOperations from '../commons/ddb/DynamoDbTableOperations'
import {
  DonorSearchFields,
  DonorSearchModel
} from '../../../application/models/dbModels/DonorSearchModel'
import { GeohashCacheManager } from '../../../application/utils/GeohashCacheMapManager'
import { getDistanceBetweenGeohashes } from '../../../application/utils/geohash'
import GeohashDynamoDbOperations from '../commons/ddb/GeohashDynamoDbOperations'
import { createLambdaLogger, LambdaLoggerAttributes } from '../commons/httpLogger/LambdaLogger'

type DonorInfo = {
  userId: string;
  locationId: string;
}

type GeohashDonorMap = Record<string, DonorInfo[]>

type EligibleDonorInfo = {
  distance: number;
  locationId: string;
}

type EligibleDonorWithUserId = EligibleDonorInfo & {
  userId: string;
}

type QueryEligibleDonorsInput = {
  seekerId: string;
  createdAt: string;
  requestPostId: string;
  seekerGeohash: string;
  requestedBloodGroup: string;
  city: string;
  eligibleDonors: EligibleDonorWithUserId[];
  totalDonorsToNotify: number;
}

type QueryEligibleDonorsOutput = {
  action: 'EnoughDonorsFound' | 'RetryDonorsSearch' | 'HandleSearchError';
  eligibleDonors: EligibleDonorWithUserId[];
}

const geohashCache = new GeohashCacheManager<string, GeohashDonorMap>(
  Number(process.env.MAX_GEOHASH_CACHE_ENTRIES_COUNT),
  Number(process.env.MAX_GEOHASH_CACHE_MB_SIZE),
  Number(process.env.MAX_GEOHASH_CACHE_TIMEOUT_MINUTES)
)
const donorSearchService = new DonorSearchService()

async function queryEligibleDonors(
  event: QueryEligibleDonorsInput & LambdaLoggerAttributes
): Promise<QueryEligibleDonorsOutput> {
  const LambdaLogger = createLambdaLogger(event.seekerId)
  try {
    const {
      seekerId,
      createdAt,
      requestPostId,
      seekerGeohash,
      requestedBloodGroup,
      city,
      eligibleDonors,
      totalDonorsToNotify
    } = event

    const { currentNeighborSearchLevel, updatedNeighborGeohashes, updatedNeighborLevel } =
      await getUpdatedNeighborGeohashes(seekerId, createdAt, requestPostId, seekerGeohash)

    if (currentNeighborSearchLevel > Number(process.env.MAX_GEOHASH_NEIGHBOR_SEARCH_LEVEL)) {
      return {
        action: 'EnoughDonorsFound',
        eligibleDonors
      }
    }

    const { newEligibleDonors, processedGeohashCount } = await getNewDonorsInNeighborGeohash(
      seekerId,
      requestedBloodGroup,
      city,
      seekerGeohash,
      updatedNeighborGeohashes,
      transformEligibleDonorsToObject(eligibleDonors),
      totalDonorsToNotify
    )
    const geohashesForNextIteration = updatedNeighborGeohashes.slice(processedGeohashCount)

    await donorSearchService.updateDonorSearch(
      seekerId,
      createdAt,
      requestPostId,
      geohashesForNextIteration,
      updatedNeighborLevel,
      new DynamoDbTableOperations<DonorSearchDTO, DonorSearchFields, DonorSearchModel>(
        new DonorSearchModel()
      )
    )

    return {
      action:
        Object.keys(newEligibleDonors).length >= totalDonorsToNotify
          ? 'EnoughDonorsFound'
          : 'RetryDonorsSearch',
      eligibleDonors: revertEligibleDonorsToArray(newEligibleDonors)
    }
  } catch (error) {
    LambdaLogger.error(error)
    return {
      action: 'HandleSearchError',
      eligibleDonors: event.eligibleDonors
    }
  }
}

export default queryEligibleDonors

async function getUpdatedNeighborGeohashes(
  seekerId: string,
  createdAt: string,
  requestPostId: string,
  seekerGeohash: string
): Promise<{
    currentNeighborSearchLevel: number;
    updatedNeighborGeohashes: string[];
    updatedNeighborLevel: number;
  }> {
  const previousDonorSearchRecord = await donorSearchService.getDonorSearch(
    seekerId,
    createdAt,
    requestPostId,
    new DynamoDbTableOperations<DonorSearchDTO, DonorSearchFields, DonorSearchModel>(
      new DonorSearchModel()
    )
  )

  const currentNeighborSearchLevel = previousDonorSearchRecord?.currentNeighborSearchLevel ?? 0
  const remainingGeohashes = previousDonorSearchRecord?.remainingGeohashesToProcess ?? [
    seekerGeohash.slice(0, Number(process.env.NEIGHBOR_SEARCH_GEOHASH_PREFIX_LENGTH))
  ]

  const { updatedNeighborGeohashes, updatedNeighborLevel } =
    donorSearchService.getNeighborGeohashes(
      seekerGeohash.slice(0, Number(process.env.NEIGHBOR_SEARCH_GEOHASH_PREFIX_LENGTH)),
      currentNeighborSearchLevel + 1,
      remainingGeohashes
    )

  return {
    currentNeighborSearchLevel,
    updatedNeighborGeohashes,
    updatedNeighborLevel
  }
}

async function getNewDonorsInNeighborGeohash(
  seekerId: string,
  requestedBloodGroup: string,
  city: string,
  seekerGeohash: string,
  geohashesToProcess: string[],
  eligibleDonors: Record<string, EligibleDonorInfo>,
  totalDonorsToNotify: number,
  processedGeohashCount: number = 0
): Promise<{
    newEligibleDonors: Record<string, EligibleDonorInfo>;
    processedGeohashCount: number;
  }> {
  if (
    geohashesToProcess.length === 0 ||
    processedGeohashCount >= Number(process.env.MAX_GEOHASHES_PER_PROCESSING_BATCH) ||
    Object.keys(eligibleDonors).length >= totalDonorsToNotify
  ) {
    return { newEligibleDonors: eligibleDonors, processedGeohashCount }
  }

  const geohashToProcess = geohashesToProcess[0]
  const geohashCachePrefix = geohashToProcess.slice(
    0,
    Number(process.env.CACHE_GEOHASH_PREFIX_LENGTH)
  )
  const cacheKey = `${city}-${requestedBloodGroup}-${geohashCachePrefix}`
  const cachedGroupedGeohash = geohashCache.get(cacheKey)

  if (cachedGroupedGeohash === undefined) {
    const queriedDonors = await donorSearchService.queryGeohash(
      city,
      requestedBloodGroup,
      geohashCachePrefix,
      new GeohashDynamoDbOperations<LocationDTO, LocationFields, LocationModel>(new LocationModel())
    )
    updateGroupedGeohashCache(queriedDonors, cacheKey)
  }

  const cachedDonorMap = geohashCache.get(cacheKey) as GeohashDonorMap
  const donors = cachedDonorMap[geohashToProcess] ?? []

  const newDonors = donors.reduce<Record<string, EligibleDonorInfo>>(
    (donorAccumulator, donor) => {
      const donorDistance = getDistanceBetweenGeohashes(seekerGeohash, geohashToProcess)
      if (
        donor.userId !== seekerId &&
        (donorAccumulator[donor.userId] === undefined ||
          donorAccumulator[donor.userId].distance < donorDistance)
      ) {
        donorAccumulator[donor.userId] = {
          locationId: donor.locationId,
          distance: donorDistance
        }
      }
      return donorAccumulator
    },
    { ...eligibleDonors }
  )

  return getNewDonorsInNeighborGeohash(
    seekerId,
    requestedBloodGroup,
    city,
    seekerGeohash,
    geohashesToProcess.slice(1),
    newDonors,
    totalDonorsToNotify,
    processedGeohashCount + 1
  )
}

function updateGroupedGeohashCache(queriedDonors: LocationDTO[], cacheKey: string): void {
  const donorMap = groupDonorsByGeohash(queriedDonors)
  geohashCache.set(cacheKey, donorMap)
}

function groupDonorsByGeohash(queriedDonors: LocationDTO[]): GeohashDonorMap {
  return queriedDonors.reduce<GeohashDonorMap>((groups, donor) => {
    const donorGeohash = donor.geohash.slice(
      0,
      Number(process.env.NEIGHBOR_SEARCH_GEOHASH_PREFIX_LENGTH)
    )
    if (groups[donorGeohash] == null) {
      groups[donorGeohash] = []
    }
    groups[donorGeohash].push({
      userId: donor.userId,
      locationId: donor.locationId
    })
    return groups
  }, {})
}

function revertEligibleDonorsToArray(
  eligibleDonors: Record<string, EligibleDonorInfo>
): EligibleDonorWithUserId[] {
  return Object.entries(eligibleDonors).map(([userId, donor]) => ({
    userId,
    ...donor
  }))
}

function transformEligibleDonorsToObject(
  eligibleDonorsArray: EligibleDonorWithUserId[]
): Record<string, EligibleDonorInfo> {
  return eligibleDonorsArray.reduce<Record<string, EligibleDonorInfo>>((accumulator, donor) => {
    const { userId, ...donorInfo } = donor
    accumulator[userId] = donorInfo
    return accumulator
  }, {})
}
