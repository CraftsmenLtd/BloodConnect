import type { LocationDTO } from 'commons/dto/UserDTO'

export type DonorInfo = {
  userId: string;
  locationId: string;
}

export type GeohashDonorMap = Record<string, DonorInfo[]>

export class GeohashCacheManager<K, V> {
  private readonly cache: Map<K, { data: V; timestamp: number }>
  private readonly maxEntries: number
  private readonly maxByteSize: number
  private readonly cacheTimeoutMinutes: number
  private currentByteSize: number

  constructor(maxEntries: number, maxMBSize: number, cacheTimeoutMinutes: number) {
    if (
      !Number.isInteger(maxEntries)
      || !Number.isInteger(maxMBSize)
      || !Number.isInteger(cacheTimeoutMinutes)
    ) {
      throw new Error('All parameters must be integers!')
    }

    this.cache = new Map()
    this.maxEntries = maxEntries
    this.maxByteSize = maxMBSize * 1024 * 1024
    this.cacheTimeoutMinutes = cacheTimeoutMinutes
    this.currentByteSize = 0
  }

  private calculateByteSize(value: unknown): number {
    return new TextEncoder().encode(JSON.stringify(value)).length
  }

  set(key: K, data: V): void {
    const dataByteSize = this.calculateByteSize(data)

    while (
      (this.cache.size >= this.maxEntries
        || this.currentByteSize + dataByteSize > this.maxByteSize)
      && this.cache.size > 0
    ) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey !== undefined) {
        const oldestEntry = this.cache.get(oldestKey)
        if (oldestEntry !== undefined) {
          this.currentByteSize -= this.calculateByteSize(oldestEntry.data)
        }
        this.cache.delete(oldestKey)
      }
    }

    const timestamp = Date.now()
    this.cache.set(key, { data, timestamp })
    this.currentByteSize += dataByteSize
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key)
    const currentTime = Date.now()

    if (entry !== undefined) {
      const timeDifferenceMinutes = (currentTime - entry.timestamp) / (1000 * 60)

      if (timeDifferenceMinutes > this.cacheTimeoutMinutes) {
        this.cache.delete(key)
        this.currentByteSize -= this.calculateByteSize(entry.data)

        return undefined
      }

      return entry.data
    }

    return undefined
  }
}

export function updateGroupedGeohashCache(
  geohashCacheManager: GeohashCacheManager<string, GeohashDonorMap>,
  queriedDonors: LocationDTO[],
  cacheKey: string,
  neighborSearchGeohashPrefixLength: number
): void {
  const donorMap = groupDonorsByGeohash(queriedDonors, neighborSearchGeohashPrefixLength)
  geohashCacheManager.set(cacheKey, donorMap)
}

function groupDonorsByGeohash(
  queriedDonors: LocationDTO[],
  neighborSearchGeohashPrefixLength: number
): GeohashDonorMap {
  return queriedDonors.reduce<GeohashDonorMap>((groups, donor) => {
    const donorGeohash = donor.geohash.slice(0, neighborSearchGeohashPrefixLength)
    if (groups[donorGeohash] === null) {
      groups[donorGeohash] = []
    }
    groups[donorGeohash].push({
      userId: donor.userId,
      locationId: donor.locationId
    })

    return groups
  }, {})
}
