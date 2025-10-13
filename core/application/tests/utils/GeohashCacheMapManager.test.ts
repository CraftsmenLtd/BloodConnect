import { GeohashCacheManager, updateGroupedGeohashCache, type GeohashDonorMap } from '../../utils/GeohashCacheMapManager'
import type { LocationDTO } from '../../../../commons/dto/UserDTO'

describe('GeohashCacheManager', () => {
  describe('constructor', () => {
    test('should create cache manager with valid integer parameters', () => {
      const cacheManager = new GeohashCacheManager<string, string>(100, 10, 30)
      expect(cacheManager).toBeInstanceOf(GeohashCacheManager)
    })

    test('should throw error when maxEntries is not an integer', () => {
      expect(() => {
        new GeohashCacheManager<string, string>(100.5, 10, 30)
      }).toThrow('All parameters must be integers!')
    })

    test('should throw error when maxMBSize is not an integer', () => {
      expect(() => {
        new GeohashCacheManager<string, string>(100, 10.5, 30)
      }).toThrow('All parameters must be integers!')
    })

    test('should throw error when cacheTimeoutMinutes is not an integer', () => {
      expect(() => {
        new GeohashCacheManager<string, string>(100, 10, 30.7)
      }).toThrow('All parameters must be integers!')
    })

    test('should throw error when multiple parameters are not integers', () => {
      expect(() => {
        new GeohashCacheManager<string, string>(100.1, 10.2, 30.3)
      }).toThrow('All parameters must be integers!')
    })
  })

  describe('set and get', () => {
    test('should store and retrieve value', () => {
      const cacheManager = new GeohashCacheManager<string, string>(10, 10, 30)
      cacheManager.set('key1', 'value1')

      const result = cacheManager.get('key1')
      expect(result).toBe('value1')
    })

    test('should store and retrieve complex objects', () => {
      const cacheManager = new GeohashCacheManager<string, { name: string; age: number }>(10, 10, 30)
      const data = { name: 'John', age: 30 }

      cacheManager.set('user1', data)

      const result = cacheManager.get('user1')
      expect(result).toEqual(data)
    })

    test('should return undefined for non-existent key', () => {
      const cacheManager = new GeohashCacheManager<string, string>(10, 10, 30)
      const result = cacheManager.get('nonexistent')
      expect(result).toBeUndefined()
    })

    test('should overwrite existing key', () => {
      const cacheManager = new GeohashCacheManager<string, string>(10, 10, 30)
      cacheManager.set('key1', 'value1')
      cacheManager.set('key1', 'value2')

      const result = cacheManager.get('key1')
      expect(result).toBe('value2')
    })

    test('should handle multiple keys', () => {
      const cacheManager = new GeohashCacheManager<string, string>(10, 10, 30)
      cacheManager.set('key1', 'value1')
      cacheManager.set('key2', 'value2')
      cacheManager.set('key3', 'value3')

      expect(cacheManager.get('key1')).toBe('value1')
      expect(cacheManager.get('key2')).toBe('value2')
      expect(cacheManager.get('key3')).toBe('value3')
    })
  })

  describe('cache eviction by max entries', () => {
    test('should evict oldest entry when max entries reached', () => {
      const cacheManager = new GeohashCacheManager<string, string>(2, 10, 30)

      cacheManager.set('key1', 'value1')
      cacheManager.set('key2', 'value2')
      cacheManager.set('key3', 'value3')

      expect(cacheManager.get('key1')).toBeUndefined()
      expect(cacheManager.get('key2')).toBe('value2')
      expect(cacheManager.get('key3')).toBe('value3')
    })

    test('should evict multiple oldest entries when needed', () => {
      const cacheManager = new GeohashCacheManager<string, string>(3, 10, 30)

      cacheManager.set('key1', 'value1')
      cacheManager.set('key2', 'value2')
      cacheManager.set('key3', 'value3')
      cacheManager.set('key4', 'value4')
      cacheManager.set('key5', 'value5')

      expect(cacheManager.get('key1')).toBeUndefined()
      expect(cacheManager.get('key2')).toBeUndefined()
      expect(cacheManager.get('key3')).toBe('value3')
      expect(cacheManager.get('key4')).toBe('value4')
      expect(cacheManager.get('key5')).toBe('value5')
    })

    test('should handle max entries of 1', () => {
      const cacheManager = new GeohashCacheManager<string, string>(1, 10, 30)

      cacheManager.set('key1', 'value1')
      expect(cacheManager.get('key1')).toBe('value1')

      cacheManager.set('key2', 'value2')
      expect(cacheManager.get('key1')).toBeUndefined()
      expect(cacheManager.get('key2')).toBe('value2')
    })
  })

  describe('cache eviction by byte size', () => {
    test('should evict entries when byte size limit reached', () => {
      // Very small cache size (1 MB) to trigger eviction with large data
      const cacheManager = new GeohashCacheManager<string, string>(100, 1, 30)

      // Add a large value (over 1MB) that should trigger eviction
      const largeValue1 = 'x'.repeat(500000) // ~500KB
      const largeValue2 = 'y'.repeat(600000) // ~600KB

      cacheManager.set('key1', largeValue1)
      expect(cacheManager.get('key1')).toBe(largeValue1)

      // Adding this should evict key1 due to byte size limit
      cacheManager.set('key2', largeValue2)

      // First key should be evicted due to byte size
      expect(cacheManager.get('key1')).toBeUndefined()
      expect(cacheManager.get('key2')).toBe(largeValue2)
    })

    test('should track byte size correctly when updating values', () => {
      const cacheManager = new GeohashCacheManager<string, string>(10, 10, 30)

      cacheManager.set('key1', 'small')
      cacheManager.set('key1', 'larger value that replaces small')

      expect(cacheManager.get('key1')).toBe('larger value that replaces small')
    })
  })

  describe('cache timeout', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    test('should return value before timeout', () => {
      const cacheManager = new GeohashCacheManager<string, string>(10, 10, 30)
      cacheManager.set('key1', 'value1')

      // Advance time by 29 minutes (less than 30 minute timeout)
      jest.advanceTimersByTime(29 * 60 * 1000)

      expect(cacheManager.get('key1')).toBe('value1')
    })

    test('should return undefined after timeout', () => {
      const cacheManager = new GeohashCacheManager<string, string>(10, 10, 30)
      cacheManager.set('key1', 'value1')

      // Advance time by 31 minutes (more than 30 minute timeout)
      jest.advanceTimersByTime(31 * 60 * 1000)

      expect(cacheManager.get('key1')).toBeUndefined()
    })

    test('should handle exact timeout boundary', () => {
      const cacheManager = new GeohashCacheManager<string, string>(10, 10, 30)
      cacheManager.set('key1', 'value1')

      // Advance time by exactly 30 minutes
      jest.advanceTimersByTime(30 * 60 * 1000)

      expect(cacheManager.get('key1')).toBe('value1')
    })

    test('should handle different timeout values', () => {
      const cacheManager = new GeohashCacheManager<string, string>(10, 10, 5)
      cacheManager.set('key1', 'value1')

      // Advance time by 6 minutes (more than 5 minute timeout)
      jest.advanceTimersByTime(6 * 60 * 1000)

      expect(cacheManager.get('key1')).toBeUndefined()
    })

    test('should only expire specific entry, not all entries', () => {
      const cacheManager = new GeohashCacheManager<string, string>(10, 10, 30)

      cacheManager.set('key1', 'value1')

      // Advance time by 20 minutes
      jest.advanceTimersByTime(20 * 60 * 1000)

      cacheManager.set('key2', 'value2')

      // Advance time by 15 more minutes (total 35 for key1, 15 for key2)
      jest.advanceTimersByTime(15 * 60 * 1000)

      expect(cacheManager.get('key1')).toBeUndefined()
      expect(cacheManager.get('key2')).toBe('value2')
    })
  })

  describe('edge cases', () => {
    test('should handle empty string values', () => {
      const cacheManager = new GeohashCacheManager<string, string>(10, 10, 30)
      cacheManager.set('key1', '')

      expect(cacheManager.get('key1')).toBe('')
    })

    test('should handle null values in objects', () => {
      const cacheManager = new GeohashCacheManager<string, { value: string | null }>(10, 10, 30)
      cacheManager.set('key1', { value: null })

      expect(cacheManager.get('key1')).toEqual({ value: null })
    })

    test('should handle arrays', () => {
      const cacheManager = new GeohashCacheManager<string, number[]>(10, 10, 30)
      const array = [1, 2, 3, 4, 5]
      cacheManager.set('key1', array)

      expect(cacheManager.get('key1')).toEqual(array)
    })

    test('should handle nested objects', () => {
      const cacheManager = new GeohashCacheManager<string, any>(10, 10, 30)
      const nested = {
        user: {
          name: 'John',
          address: {
            city: 'Dhaka',
            country: 'Bangladesh'
          }
        }
      }
      cacheManager.set('key1', nested)

      expect(cacheManager.get('key1')).toEqual(nested)
    })

    test('should handle numeric keys', () => {
      const cacheManager = new GeohashCacheManager<number, string>(10, 10, 30)
      cacheManager.set(123, 'value1')
      cacheManager.set(456, 'value2')

      expect(cacheManager.get(123)).toBe('value1')
      expect(cacheManager.get(456)).toBe('value2')
    })
  })
})

describe('updateGroupedGeohashCache', () => {
  test('should update cache with grouped donors by geohash prefix', () => {
    const cacheManager = new GeohashCacheManager<string, GeohashDonorMap>(10, 10, 30)

    const queriedDonors: LocationDTO[] = [
      {
        userId: 'user1',
        locationId: 'loc1',
        area: 'Dhaka',
        countryCode: 'BD',
        latitude: 23.8103,
        longitude: 90.4125,
        geohash: 'w4rq8p9q',
        bloodGroup: 'A+',
        availableForDonation: true,
        lastVaccinatedDate: '2024-01-01',
        createdAt: '2025-01-15T10:00:00.000Z'
      },
      {
        userId: 'user2',
        locationId: 'loc2',
        area: 'Dhaka',
        countryCode: 'BD',
        latitude: 23.8104,
        longitude: 90.4126,
        geohash: 'w4rq8p9r',
        bloodGroup: 'A+',
        availableForDonation: true,
        lastVaccinatedDate: '2024-01-01',
        createdAt: '2025-01-15T11:00:00.000Z'
      }
    ]

    updateGroupedGeohashCache(cacheManager, queriedDonors, 'cache-key', 7)

    const result = cacheManager.get('cache-key')

    expect(result).toBeDefined()
    expect(result?.['w4rq8p9']).toHaveLength(2)
    expect(result?.['w4rq8p9'][0]).toEqual({ userId: 'user1', locationId: 'loc1' })
    expect(result?.['w4rq8p9'][1]).toEqual({ userId: 'user2', locationId: 'loc2' })
  })

  test('should group donors by different geohash prefixes', () => {
    const cacheManager = new GeohashCacheManager<string, GeohashDonorMap>(10, 10, 30)

    const queriedDonors: LocationDTO[] = [
      {
        userId: 'user1',
        locationId: 'loc1',
        area: 'Dhaka',
        countryCode: 'BD',
        latitude: 23.8103,
        longitude: 90.4125,
        geohash: 'w4rq8p9q',
        bloodGroup: 'A+',
        availableForDonation: true,
        lastVaccinatedDate: '2024-01-01',
        createdAt: '2025-01-15T10:00:00.000Z'
      },
      {
        userId: 'user2',
        locationId: 'loc2',
        area: 'Chittagong',
        countryCode: 'BD',
        latitude: 22.3569,
        longitude: 91.7832,
        geohash: 'w2mgu7d1',
        bloodGroup: 'A+',
        availableForDonation: true,
        lastVaccinatedDate: '2024-01-01',
        createdAt: '2025-01-15T11:00:00.000Z'
      }
    ]

    updateGroupedGeohashCache(cacheManager, queriedDonors, 'cache-key', 7)

    const result = cacheManager.get('cache-key')

    expect(result).toBeDefined()
    expect(result?.['w4rq8p9']).toHaveLength(1)
    expect(result?.['w2mgu7d']).toHaveLength(1)
    expect(result?.['w4rq8p9'][0]).toEqual({ userId: 'user1', locationId: 'loc1' })
    expect(result?.['w2mgu7d'][0]).toEqual({ userId: 'user2', locationId: 'loc2' })
  })

  test('should handle empty donors array', () => {
    const cacheManager = new GeohashCacheManager<string, GeohashDonorMap>(10, 10, 30)

    updateGroupedGeohashCache(cacheManager, [], 'cache-key', 7)

    const result = cacheManager.get('cache-key')

    expect(result).toEqual({})
  })

  test('should use specified prefix length', () => {
    const cacheManager = new GeohashCacheManager<string, GeohashDonorMap>(10, 10, 30)

    const queriedDonors: LocationDTO[] = [
      {
        userId: 'user1',
        locationId: 'loc1',
        area: 'Dhaka',
        countryCode: 'BD',
        latitude: 23.8103,
        longitude: 90.4125,
        geohash: 'w4rq8p9q',
        bloodGroup: 'A+',
        availableForDonation: true,
        lastVaccinatedDate: '2024-01-01',
        createdAt: '2025-01-15T10:00:00.000Z'
      }
    ]

    // Use prefix length of 4
    updateGroupedGeohashCache(cacheManager, queriedDonors, 'cache-key', 4)

    const result = cacheManager.get('cache-key')

    expect(result).toBeDefined()
    expect(result?.['w4rq']).toHaveLength(1)
  })

  test('should group multiple donors with same prefix', () => {
    const cacheManager = new GeohashCacheManager<string, GeohashDonorMap>(10, 10, 30)

    const queriedDonors: LocationDTO[] = [
      {
        userId: 'user1',
        locationId: 'loc1',
        area: 'Dhaka',
        countryCode: 'BD',
        latitude: 23.8103,
        longitude: 90.4125,
        geohash: 'w4rq8p9q',
        bloodGroup: 'A+',
        availableForDonation: true,
        lastVaccinatedDate: '2024-01-01',
        createdAt: '2025-01-15T10:00:00.000Z'
      },
      {
        userId: 'user2',
        locationId: 'loc2',
        area: 'Dhaka',
        countryCode: 'BD',
        latitude: 23.8104,
        longitude: 90.4126,
        geohash: 'w4rq8p9r',
        bloodGroup: 'A+',
        availableForDonation: true,
        lastVaccinatedDate: '2024-01-01',
        createdAt: '2025-01-15T11:00:00.000Z'
      },
      {
        userId: 'user3',
        locationId: 'loc3',
        area: 'Dhaka',
        countryCode: 'BD',
        latitude: 23.8105,
        longitude: 90.4127,
        geohash: 'w4rq8p9s',
        bloodGroup: 'A+',
        availableForDonation: true,
        lastVaccinatedDate: '2024-01-01',
        createdAt: '2025-01-15T12:00:00.000Z'
      }
    ]

    updateGroupedGeohashCache(cacheManager, queriedDonors, 'cache-key', 7)

    const result = cacheManager.get('cache-key')

    expect(result).toBeDefined()
    expect(result?.['w4rq8p9']).toHaveLength(3)
  })

  test('should only store userId and locationId in grouped data', () => {
    const cacheManager = new GeohashCacheManager<string, GeohashDonorMap>(10, 10, 30)

    const queriedDonors: LocationDTO[] = [
      {
        userId: 'user1',
        locationId: 'loc1',
        area: 'Dhaka',
        countryCode: 'BD',
        latitude: 23.8103,
        longitude: 90.4125,
        geohash: 'w4rq8p9q',
        bloodGroup: 'A+',
        availableForDonation: true,
        lastVaccinatedDate: '2024-01-01',
        createdAt: '2025-01-15T10:00:00.000Z'
      }
    ]

    updateGroupedGeohashCache(cacheManager, queriedDonors, 'cache-key', 7)

    const result = cacheManager.get('cache-key')

    expect(result?.['w4rq8p9'][0]).toEqual({
      userId: 'user1',
      locationId: 'loc1'
    })
    expect(result?.['w4rq8p9'][0]).not.toHaveProperty('area')
    expect(result?.['w4rq8p9'][0]).not.toHaveProperty('bloodGroup')
  })

  test('should handle different cache keys independently', () => {
    const cacheManager = new GeohashCacheManager<string, GeohashDonorMap>(10, 10, 30)

    const donors1: LocationDTO[] = [
      {
        userId: 'user1',
        locationId: 'loc1',
        area: 'Dhaka',
        countryCode: 'BD',
        latitude: 23.8103,
        longitude: 90.4125,
        geohash: 'w4rq8p9q',
        bloodGroup: 'A+',
        availableForDonation: true,
        lastVaccinatedDate: '2024-01-01',
        createdAt: '2025-01-15T10:00:00.000Z'
      }
    ]

    const donors2: LocationDTO[] = [
      {
        userId: 'user2',
        locationId: 'loc2',
        area: 'Chittagong',
        countryCode: 'BD',
        latitude: 22.3569,
        longitude: 91.7832,
        geohash: 'w2mgu7d1',
        bloodGroup: 'B+',
        availableForDonation: true,
        lastVaccinatedDate: '2024-01-01',
        createdAt: '2025-01-15T11:00:00.000Z'
      }
    ]

    updateGroupedGeohashCache(cacheManager, donors1, 'key1', 7)
    updateGroupedGeohashCache(cacheManager, donors2, 'key2', 7)

    const result1 = cacheManager.get('key1')
    const result2 = cacheManager.get('key2')

    expect(result1?.['w4rq8p9']).toHaveLength(1)
    expect(result2?.['w2mgu7d']).toHaveLength(1)
  })
})
