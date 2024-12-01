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

interface DonorInfo {
  userId: string;
  locationId: string;
}

type GeohashDonorMap = Record<string, DonorInfo[]>

interface EligibleDonorInfo extends DonorInfo {
  distance: number;
}

interface QueryEligibleDonorsInput {
  seekerId: string;
  createdAt: string;
  requestPostId: string;
  seekerGeohash: string;
  neededBloodGroup: string;
  city: string;
  eligibleDonors: EligibleDonorInfo[];
  totalDonorsToNotify: number;
}

interface QueryEligibleDonorsOutput {
  action: 'EnoughDonorsFound' | 'RetryDonorsSearch';
  eligibleDonors?: DonorInfo[];
}

const geohashCache = new GeohashCacheManager<string, GeohashDonorMap>(
  MAX_GEOHASH_CACHE_ENTRIES_COUNT,
  MAX_GEOHASH_CACHE_MB_SIZE,
  MAX_GEOHASH_CACHE_TIMEOUT_MINUTES
)
const donorSearchService = new DonorSearchService()

async function queryEligibleDonors(event: QueryEligibleDonorsInput): Promise<QueryEligibleDonorsOutput> {
  const {
    seekerId,
    createdAt,
    requestPostId,
    seekerGeohash,
    neededBloodGroup,
    city,
    eligibleDonors,
    totalDonorsToNotify
  } = event

  const donorSearchRecord = await donorSearchService.getDonorSearch(
    seekerId,
    createdAt,
    requestPostId,
    new DynamoDbTableOperations<DonorSearchDTO, DonorSearchFields, DonorSearchModel>(
      new DonorSearchModel()
    )
  )

  const currentNeighborLevel = donorSearchRecord?.currentNeighborLevel ?? 0

  if (currentNeighborLevel < MAX_GEOHASH_NEIGHBOR_SEARCH_LEVEL) {
    const neighborGeohashes = donorSearchRecord?.currentNeighborGeohashes ?? [
      seekerGeohash.slice(0, NEIGHBOR_SEARCH_GEOHASH_PREFIX_LENGTH)
    ]
    const geohashesToProcess = neighborGeohashes.slice(0, MAX_GEOHASHES_PER_PROCESSING_BATCH)
    const remainingGeohashes = neighborGeohashes.slice(MAX_GEOHASHES_PER_PROCESSING_BATCH)

    for (const geohashToProcess of geohashesToProcess) {
      const cacheKey = `${city}-${neededBloodGroup}-${geohashToProcess.slice(0, CACHE_GEOHASH_PREFIX_LENGTH)}`
      const cachedDonorData = geohashCache.get(cacheKey)

      if (cachedDonorData === undefined) {
        const donorMap = await updateDonorCache(
          city,
          neededBloodGroup,
          geohashToProcess,
          cacheKey
        )

        addEligibleDonors(donorMap, geohashToProcess, seekerGeohash, eligibleDonors)
      } else {
        addEligibleDonors(cachedDonorData, geohashToProcess, seekerGeohash, eligibleDonors)
      }
    }

    await donorSearchService.updateDonorSearch(
      seekerId,
      createdAt,
      requestPostId,
      seekerGeohash,
      remainingGeohashes,
      currentNeighborLevel,
      new DynamoDbTableOperations<DonorSearchDTO, DonorSearchFields, DonorSearchModel>(
        new DonorSearchModel()
      )
    )

    const uniqueDonors = getUniqueDonors(eligibleDonors, seekerId)
    return {
      action:
        uniqueDonors.length >= totalDonorsToNotify
          ? 'EnoughDonorsFound'
          : 'RetryDonorsSearch',
      eligibleDonors: uniqueDonors
    }
  } else {
    const updatedEligibleDonors = await queryAllDonors(
      city,
      neededBloodGroup,
      seekerGeohash,
      eligibleDonors,
      totalDonorsToNotify
    )
    return {
      action: 'EnoughDonorsFound',
      eligibleDonors: getUniqueDonors(updatedEligibleDonors, seekerId)
    }
  }
}

export default queryEligibleDonors

async function queryAllDonors(
  city: string,
  neededBloodGroup: string,
  seekerGeohash: string,
  eligibleDonors: EligibleDonorInfo[],
  totalDonorsToNotify: number
): Promise<EligibleDonorInfo[]> {
  const allDonors = await donorSearchService.queryGeohash(
    city,
    neededBloodGroup,
    '',
    new DynamoDbTableOperations<LocationDTO, LocationFields, LocationModel>(new LocationModel())
  )
  const sortedDonors = allDonors
    .map((donor) => ({
      userId: donor.userId,
      locationId: donor.locationId,
      distance: getDistanceBetweenGeohashes(seekerGeohash, donor.geohash)
    }))
    .sort((a, b) => a.distance - b.distance)
  eligibleDonors.push(...sortedDonors.slice(0, totalDonorsToNotify))
  return eligibleDonors
}

function addEligibleDonors(
  donorMap: GeohashDonorMap,
  geohashToProcess: string,
  geohash: string,
  eligibleDonors: EligibleDonorInfo[]
): void {
  if (donorMap[geohashToProcess] !== undefined) {
    donorMap[geohashToProcess].forEach((donor) => {
      const eligibleDonor: EligibleDonorInfo = {
        ...donor,
        distance: getDistanceBetweenGeohashes(geohash, geohashToProcess)
      }
      eligibleDonors.push(eligibleDonor)
    })
  }
}

async function updateDonorCache(
  city: string,
  neededBloodGroup: string,
  geohashToProcess: string,
  cacheKey: string
): Promise<GeohashDonorMap> {
  const queriedDonors = await donorSearchService.queryGeohash(
    city,
    neededBloodGroup,
    geohashToProcess.slice(0, CACHE_GEOHASH_PREFIX_LENGTH),
    new DynamoDbTableOperations<LocationDTO, LocationFields, LocationModel>(new LocationModel())
  )

  const donorMap = mapDonorsByGeohash(queriedDonors)
  geohashCache.set(cacheKey, donorMap)
  return donorMap
}

function mapDonorsByGeohash(queriedDonors: LocationDTO[]): GeohashDonorMap {
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

function getUniqueDonors(donors: EligibleDonorInfo[], seekerId: string): EligibleDonorInfo[] {
  const donorMap = new Map<string, EligibleDonorInfo>()
  for (const donor of donors) {
    const existing = donorMap.get(donor.userId)
    if (existing === undefined || donor.distance < existing.distance) {
      donorMap.set(donor.userId, donor)
    }
  }
  donorMap.delete(seekerId)
  return Array.from(donorMap.values())
}
