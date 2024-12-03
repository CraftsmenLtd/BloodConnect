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
import {
  MAX_GEOHASH_CACHE_ENTRIES_COUNT,
  MAX_GEOHASH_CACHE_MB_SIZE,
  MAX_GEOHASH_CACHE_TIMEOUT_MINUTES,
  CACHE_GEOHASH_PREFIX_LENGTH,
  MAX_GEOHASHES_PER_PROCESSING_BATCH,
  MAX_GEOHASH_NEIGHBOR_SEARCH_LEVEL,
  NEIGHBOR_SEARCH_GEOHASH_PREFIX_LENGTH
} from '../../../../commons/libs/constants/NoMagicNumbers'

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
  action: 'EnoughDonorsFound' | 'RetryDonorsSearch';
  eligibleDonors: EligibleDonorWithUserId[];
}

const geohashCache = new GeohashCacheManager<string, GeohashDonorMap>(
  MAX_GEOHASH_CACHE_ENTRIES_COUNT,
  MAX_GEOHASH_CACHE_MB_SIZE,
  MAX_GEOHASH_CACHE_TIMEOUT_MINUTES
)
const donorSearchService = new DonorSearchService()

async function queryEligibleDonors(
  event: QueryEligibleDonorsInput
): Promise<QueryEligibleDonorsOutput> {
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

  const previousDonorSearchRecord = await donorSearchService.getDonorSearch(
    seekerId,
    createdAt,
    requestPostId,
    new DynamoDbTableOperations<DonorSearchDTO, DonorSearchFields, DonorSearchModel>(
      new DonorSearchModel()
    )
  )

  const currentNeighborSearchLevel = previousDonorSearchRecord?.currentNeighborSearchLevel ?? 0

  if (currentNeighborSearchLevel < MAX_GEOHASH_NEIGHBOR_SEARCH_LEVEL) {
    const remainingGeohashes = previousDonorSearchRecord?.remainingGeohashesToProcess ?? [
      seekerGeohash.slice(0, NEIGHBOR_SEARCH_GEOHASH_PREFIX_LENGTH)
    ]

    const { newEligibleDonors, processedGeohashCount } = await getNewDonorsInNeighborGeohash(
      remainingGeohashes,
      city,
      requestedBloodGroup,
      seekerGeohash,
      seekerId,
      transformEligibleDonorsToObject(eligibleDonors)
    )
    const geohashesForNextIteration = remainingGeohashes.slice(processedGeohashCount)

    await donorSearchService.updateDonorSearch(
      seekerId,
      createdAt,
      requestPostId,
      seekerGeohash.slice(0, NEIGHBOR_SEARCH_GEOHASH_PREFIX_LENGTH),
      geohashesForNextIteration,
      currentNeighborSearchLevel,
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
  } else {
    const closestDonors = await getClosestDonorsAcrossAll(
      city,
      requestedBloodGroup,
      seekerGeohash,
      seekerId,
      totalDonorsToNotify
    )

    return {
      action: 'EnoughDonorsFound',
      eligibleDonors: revertEligibleDonorsToArray(closestDonors)
    }
  }
}

export default queryEligibleDonors

async function getNewDonorsInNeighborGeohash(
  geohashesToProcess: string[],
  city: string,
  requestedBloodGroup: string,
  seekerGeohash: string,
  seekerId: string,
  eligibleDonors: Record<string, EligibleDonorInfo>,
  processedGeohashCount: number = 0
): Promise<{ newEligibleDonors: Record<string, EligibleDonorInfo>; processedGeohashCount: number }> {
  if (geohashesToProcess.length === 0 || processedGeohashCount >= MAX_GEOHASHES_PER_PROCESSING_BATCH || Object.keys(eligibleDonors).length > 10) {
    return { newEligibleDonors: eligibleDonors, processedGeohashCount }
  }

  const geohashToProcess = geohashesToProcess[0]
  const geohashCachePrefix = geohashToProcess.slice(0, CACHE_GEOHASH_PREFIX_LENGTH)
  const cacheKey = `${city}-${requestedBloodGroup}-${geohashCachePrefix}`
  const cachedGroupedGeohash = geohashCache.get(cacheKey)

  if (cachedGroupedGeohash === undefined) {
    const queriedDonors = await donorSearchService.queryGeohash(
      city,
      requestedBloodGroup,
      geohashCachePrefix,
      new DynamoDbTableOperations<LocationDTO, LocationFields, LocationModel>(
        new LocationModel()
      )
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
    geohashesToProcess.slice(1), city,
    requestedBloodGroup,
    seekerGeohash,
    seekerId,
    newDonors,
    processedGeohashCount + 1
  )
}

async function getClosestDonorsAcrossAll(
  city: string,
  requestedBloodGroup: string,
  seekerGeohash: string,
  seekerId: string,
  totalDonorsToNotify: number
): Promise<Record<string, EligibleDonorInfo>> {
  const allDonors = await donorSearchService.queryGeohash(
    city,
    requestedBloodGroup,
    '',
    new DynamoDbTableOperations<LocationDTO, LocationFields, LocationModel>(new LocationModel())
  )
  const newFoundEligibleDonors = allDonors.reduce<Record<string, EligibleDonorInfo>>(
    (accumulator, donor) => {
      const donorDistance = getDistanceBetweenGeohashes(seekerGeohash, donor.geohash)

      if (
        donor.userId !== seekerId &&
        (accumulator[donor.userId] === undefined ||
          accumulator[donor.userId].distance > donorDistance)
      ) {
        accumulator[donor.userId] = {
          locationId: donor.locationId,
          distance: donorDistance
        }
      }
      return accumulator
    },
    {}
  )
  const closestDonors = Object.entries(newFoundEligibleDonors)
    .sort(([, a], [, b]) => a.distance - b.distance)
    .slice(0, totalDonorsToNotify)
    .reduce<Record<string, EligibleDonorInfo>>((result, [key, value]) => {
    result[key] = value
    return result
  }, {})
  return closestDonors
}

function updateGroupedGeohashCache(queriedDonors: LocationDTO[], cacheKey: string): void {
  const donorMap = groupDonorsByGeohash(queriedDonors)
  geohashCache.set(cacheKey, donorMap)
}

function groupDonorsByGeohash(queriedDonors: LocationDTO[]): GeohashDonorMap {
  return queriedDonors.reduce<GeohashDonorMap>((groups, donor) => {
    const donorGeohash = donor.geohash.slice(0, NEIGHBOR_SEARCH_GEOHASH_PREFIX_LENGTH)
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

function revertEligibleDonorsToArray(eligibleDonors: Record<string, EligibleDonorInfo>):
EligibleDonorWithUserId[] {
  return Object.entries(eligibleDonors).map(([userId, donor]) => ({
    userId,
    ...donor
  }))
}

function transformEligibleDonorsToObject(eligibleDonorsArray: EligibleDonorWithUserId[]):
Record<string, EligibleDonorInfo> {
  return eligibleDonorsArray.reduce<Record<string, EligibleDonorInfo>>((accumulator, donor) => {
    const { userId, ...donorInfo } = donor
    accumulator[userId] = donorInfo
    return accumulator
  }, {})
}
