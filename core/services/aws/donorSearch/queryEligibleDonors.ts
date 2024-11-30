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
  MAX_GEOHASH_CACHE_CACHE_TIMEOUT_MINUTES
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
  geohash: string;
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
  MAX_GEOHASH_CACHE_CACHE_TIMEOUT_MINUTES
)
const donorSearchService = new DonorSearchService()

async function queryEligibleDonors(event: QueryEligibleDonorsInput): Promise<QueryEligibleDonorsOutput> {
  const {
    seekerId,
    createdAt,
    requestPostId,
    geohash,
    neededBloodGroup,
    city,
    eligibleDonors,
    totalDonorsToNotify
  } = event

  const donorSearch = await donorSearchService.getDonorSearch(
    seekerId,
    createdAt,
    requestPostId,
    new DynamoDbTableOperations<DonorSearchDTO, DonorSearchFields, DonorSearchModel>(
      new DonorSearchModel()
    )
  )

  const currentNeighborLevel = donorSearch?.currentNeighborLevel ?? 0

  if (currentNeighborLevel < 3) {
    const neighborGeohashes = (donorSearch?.currentNeighborGeohashes ?? [geohash.slice(0, 7)])
      .filter((hash): hash is string => hash !== undefined)

    const geohashesToQuery = neighborGeohashes.slice(0, 8)
    const updatedNeighborGeohashes = neighborGeohashes.slice(8)

    for (const geohashToQuery of geohashesToQuery) {

      const cacheKey = `${city}-${neededBloodGroup}-${geohashToQuery.slice(0, 6)}`
      const cachedDonors = geohashCache.get(cacheKey)

      if (cachedDonors === undefined) {
        const queriedDonors = await donorSearchService.queryGeohash(
          city,
          neededBloodGroup,
          geohashToQuery.slice(0, 6),
          new DynamoDbTableOperations<LocationDTO, LocationFields, LocationModel>(
            new LocationModel()
          )
        )

        const donorMap = queriedDonors.reduce<GeohashDonorMap>((groups, donor) => {
          if (groups[donor.geohash] == null) {
            groups[donor.geohash] = []
          }
          groups[donor.geohash].push({
            userId: donor.userId,
            locationId: donor.locationId
          })
          return groups
        }, {})

        geohashCache.set(cacheKey, donorMap)

        if (donorMap[geohashToQuery] !== undefined) {
          donorMap[geohashToQuery].forEach((donor) => {
            const eligibleDonor: EligibleDonorInfo = {
              ...donor,
              distance: getDistanceBetweenGeohashes(geohash, geohashToQuery)
            }
            eligibleDonors.push(eligibleDonor)
          })
        }
      } else {
        if (cachedDonors[geohashToQuery] !== undefined) {
          cachedDonors[geohashToQuery].forEach((donor) => {
            const eligibleDonor: EligibleDonorInfo = {
              ...donor,
              distance: getDistanceBetweenGeohashes(geohash, geohashToQuery)
            }
            eligibleDonors.push(eligibleDonor)
          })
        }
      }
    }

    await donorSearchService.updateDonorSearch(
      seekerId,
      createdAt,
      requestPostId,
      geohash,
      updatedNeighborGeohashes,
      currentNeighborLevel,
      new DynamoDbTableOperations<DonorSearchDTO, DonorSearchFields, DonorSearchModel>(
        new DonorSearchModel()
      )
    )

    const uniqueEligibleDonors = filterUniqueDonors(eligibleDonors)
    return {
      action:
        uniqueEligibleDonors.length >= totalDonorsToNotify
          ? 'EnoughDonorsFound'
          : 'RetryDonorsSearch',
      eligibleDonors: uniqueEligibleDonors
    }
  } else {
    const allDonors = await donorSearchService.queryGeohash(
      city,
      neededBloodGroup,
      '',
      new DynamoDbTableOperations<LocationDTO, LocationFields, LocationModel>(new LocationModel())
    )
    const sortedDonors: EligibleDonorInfo[] = allDonors
      .map((donor) => ({
        userId: donor.userId,
        locationId: donor.locationId,
        distance: getDistanceBetweenGeohashes(geohash, donor.geohash)
      }))
      .sort((a, b) => a.distance - b.distance)
    eligibleDonors.push(...sortedDonors.slice(0, totalDonorsToNotify))
    const uniqueEligibleDonors = filterUniqueDonors(eligibleDonors)
    return {
      action: 'EnoughDonorsFound',
      eligibleDonors: uniqueEligibleDonors
    }
  }
}

export default queryEligibleDonors

function filterUniqueDonors(eligibleDonors: EligibleDonorInfo[]): EligibleDonorInfo[] {
  return Array.from(
    eligibleDonors.reduce((map, donor) => {
      const existing = map.get(donor.userId)
      if (existing === undefined || donor.distance < existing.distance) {
        map.set(donor.userId, donor)
      }
      return map
    }, new Map<string, EligibleDonorInfo>())
  ).map(([, donor]) => donor)
}
