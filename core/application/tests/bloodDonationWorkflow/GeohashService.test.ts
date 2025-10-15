import { GeohashService } from '../../bloodDonationWorkflow/GeohashService'
import type { LocationDTO } from '../../../../commons/dto/UserDTO'
import type GeohashRepository from '../../models/policies/repositories/GeohashRepository'
import type { Logger } from '../../models/logger/Logger'
import type { DonorSearchConfig } from '../../bloodDonationWorkflow/Types'
import { getGeohashNthNeighbors } from '../../utils/geohash'

jest.mock('../../utils/geohash')

describe('GeohashService', () => {
  let geohashService: GeohashService
  let mockGeohashRepository: jest.Mocked<GeohashRepository>
  let mockLogger: jest.Mocked<Logger>
  let mockConfig: DonorSearchConfig

  beforeEach(() => {
    mockGeohashRepository = {
      queryGeohash: jest.fn()
    } as unknown as jest.Mocked<GeohashRepository>

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    } as jest.Mocked<Logger>

    mockConfig = {
      dynamodbTableName: 'test-table',
      awsRegion: 'us-east-1',
      cacheGeohashPrefixLength: 4,
      maxGeohashCacheEntriesCount: 100,
      maxGeohashCacheMbSize: 10,
      maxGeohashCacheTimeoutMinutes: 30,
      maxGeohashNeighborSearchLevel: 3,
      donorSearchMaxInitiatingRetryCount: 5,
      neighborSearchGeohashPrefixLength: 7,
      donorSearchDelayBetweenExecution: 1000,
      maxGeohashPerProcessingBatch: 10,
      maxGeohashesPerExecution: 50,
      donorSearchQueueUrl: 'https://queue.url',
      notificationQueueUrl: 'https://notification.url'
    }

    geohashService = new GeohashService(
      mockGeohashRepository,
      mockLogger,
      mockConfig
    )
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('queryGeohash', () => {
    test('should query geohash and return donors when no pagination', async () => {
      const mockDonors: LocationDTO[] = [
        {
          userId: 'user-1',
          locationId: 'loc-1',
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
          userId: 'user-2',
          locationId: 'loc-2',
          area: 'Dhaka',
          countryCode: 'BD',
          latitude: 23.8104,
          longitude: 90.4126,
          geohash: 'w4rq8p9r',
          bloodGroup: 'A+',
          availableForDonation: true,
          lastVaccinatedDate: '2024-02-01',
          createdAt: '2025-01-15T11:00:00.000Z'
        }
      ]

      mockGeohashRepository.queryGeohash.mockResolvedValue({
        items: mockDonors,
        lastEvaluatedKey: null
      })

      const result = await geohashService.queryGeohash(
        'BD',
        'A+',
        'w4rq8p9q'
      )

      expect(mockGeohashRepository.queryGeohash).toHaveBeenCalledWith(
        'BD',
        'w4rq',
        'A+',
        'w4rq8p9q',
        undefined
      )
      expect(result).toEqual(mockDonors)
      expect(result).toHaveLength(2)
    })

    test('should handle pagination with lastEvaluatedKey', async () => {
      const firstPageDonors: LocationDTO[] = [
        {
          userId: 'user-1',
          locationId: 'loc-1',
          area: 'Dhaka',
          countryCode: 'BD',
          latitude: 23.8103,
          longitude: 90.4125,
          geohash: 'w4rq8p9q',
          bloodGroup: 'B+',
          availableForDonation: true,
          lastVaccinatedDate: '2024-01-01',
          createdAt: '2025-01-15T10:00:00.000Z'
        }
      ]

      const secondPageDonors: LocationDTO[] = [
        {
          userId: 'user-2',
          locationId: 'loc-2',
          area: 'Dhaka',
          countryCode: 'BD',
          latitude: 23.8104,
          longitude: 90.4126,
          geohash: 'w4rq8p9r',
          bloodGroup: 'B+',
          availableForDonation: true,
          lastVaccinatedDate: '2024-02-01',
          createdAt: '2025-01-15T11:00:00.000Z'
        }
      ]

      const lastKey = { pk: 'some-key', sk: 'some-sort-key' }

      mockGeohashRepository.queryGeohash
        .mockResolvedValueOnce({
          items: firstPageDonors,
          lastEvaluatedKey: lastKey
        })
        .mockResolvedValueOnce({
          items: secondPageDonors,
          lastEvaluatedKey: null
        })

      const result = await geohashService.queryGeohash(
        'BD',
        'B+',
        'w4rq8p9q'
      )

      expect(mockGeohashRepository.queryGeohash).toHaveBeenCalledTimes(2)
      expect(mockGeohashRepository.queryGeohash).toHaveBeenNthCalledWith(
        1,
        'BD',
        'w4rq',
        'B+',
        'w4rq8p9q',
        undefined
      )
      expect(mockGeohashRepository.queryGeohash).toHaveBeenNthCalledWith(
        2,
        'BD',
        'w4rq',
        'B+',
        'w4rq8p9q',
        lastKey
      )
      expect(result).toEqual([...firstPageDonors, ...secondPageDonors])
      expect(result).toHaveLength(2)
    })

    test('should handle multiple pagination iterations', async () => {
      const page1: LocationDTO[] = [
        {
          userId: 'user-1',
          locationId: 'loc-1',
          area: 'Dhaka',
          countryCode: 'BD',
          latitude: 23.8103,
          longitude: 90.4125,
          geohash: 'w4rq8p9q',
          bloodGroup: 'O+',
          availableForDonation: true,
          lastVaccinatedDate: '2024-01-01',
          createdAt: '2025-01-15T10:00:00.000Z'
        }
      ]

      const page2: LocationDTO[] = [
        {
          userId: 'user-2',
          locationId: 'loc-2',
          area: 'Dhaka',
          countryCode: 'BD',
          latitude: 23.8104,
          longitude: 90.4126,
          geohash: 'w4rq8p9r',
          bloodGroup: 'O+',
          availableForDonation: true,
          lastVaccinatedDate: '2024-02-01',
          createdAt: '2025-01-15T11:00:00.000Z'
        }
      ]

      const page3: LocationDTO[] = [
        {
          userId: 'user-3',
          locationId: 'loc-3',
          area: 'Dhaka',
          countryCode: 'BD',
          latitude: 23.8105,
          longitude: 90.4127,
          geohash: 'w4rq8p9s',
          bloodGroup: 'O+',
          availableForDonation: true,
          lastVaccinatedDate: '2024-03-01',
          createdAt: '2025-01-15T12:00:00.000Z'
        }
      ]

      mockGeohashRepository.queryGeohash
        .mockResolvedValueOnce({
          items: page1,
          lastEvaluatedKey: { key: 'key1' }
        })
        .mockResolvedValueOnce({
          items: page2,
          lastEvaluatedKey: { key: 'key2' }
        })
        .mockResolvedValueOnce({
          items: page3,
          lastEvaluatedKey: null
        })

      const result = await geohashService.queryGeohash(
        'BD',
        'O+',
        'w4rq8p9q'
      )

      expect(mockGeohashRepository.queryGeohash).toHaveBeenCalledTimes(3)
      expect(result).toEqual([...page1, ...page2, ...page3])
      expect(result).toHaveLength(3)
    })

    test('should return empty array when no donors found', async () => {
      mockGeohashRepository.queryGeohash.mockResolvedValue({
        items: [],
        lastEvaluatedKey: null
      })

      const result = await geohashService.queryGeohash(
        'BD',
        'AB-',
        'w4rq8p9q'
      )

      expect(result).toEqual([])
      expect(result).toHaveLength(0)
    })

    test('should handle undefined items in query result', async () => {
      mockGeohashRepository.queryGeohash.mockResolvedValue({
        items: undefined,
        lastEvaluatedKey: null
      })

      const result = await geohashService.queryGeohash(
        'BD',
        'A+',
        'w4rq8p9q'
      )

      expect(result).toEqual([])
    })

    test('should extract correct geoPartition from geohash', async () => {
      mockGeohashRepository.queryGeohash.mockResolvedValue({
        items: [],
        lastEvaluatedKey: null
      })

      await geohashService.queryGeohash(
        'US',
        'A+',
        '9q8yyzq1234'
      )

      expect(mockGeohashRepository.queryGeohash).toHaveBeenCalledWith(
        'US',
        '9q8y',
        'A+',
        '9q8yyzq1234',
        undefined
      )
    })

    test('should propagate repository errors', async () => {
      const error = new Error('DynamoDB connection failed')
      mockGeohashRepository.queryGeohash.mockRejectedValue(error)

      await expect(
        geohashService.queryGeohash('BD', 'A+', 'w4rq8p9q')
      ).rejects.toThrow('DynamoDB connection failed')
    })

    test('should accumulate donors across paginated calls', async () => {
      const existingDonors: LocationDTO[] = [
        {
          userId: 'existing-user',
          locationId: 'existing-loc',
          area: 'Dhaka',
          countryCode: 'BD',
          latitude: 23.8100,
          longitude: 90.4120,
          geohash: 'w4rq8p9p',
          bloodGroup: 'A+',
          availableForDonation: true,
          lastVaccinatedDate: '2024-01-01',
          createdAt: '2025-01-15T09:00:00.000Z'
        }
      ]

      const newDonors: LocationDTO[] = [
        {
          userId: 'new-user',
          locationId: 'new-loc',
          area: 'Dhaka',
          countryCode: 'BD',
          latitude: 23.8103,
          longitude: 90.4125,
          geohash: 'w4rq8p9q',
          bloodGroup: 'A+',
          availableForDonation: true,
          lastVaccinatedDate: '2024-02-01',
          createdAt: '2025-01-15T10:00:00.000Z'
        }
      ]

      mockGeohashRepository.queryGeohash.mockResolvedValue({
        items: newDonors,
        lastEvaluatedKey: null
      })

      const result = await geohashService.queryGeohash(
        'BD',
        'A+',
        'w4rq8p9q',
        undefined,
        existingDonors
      )

      expect(result).toEqual([...existingDonors, ...newDonors])
      expect(result).toHaveLength(2)
    })
  })

  describe('getNeighborGeohashes', () => {
    test('should stop recursion when neighborLevel equals maxGeohashNeighborSearchLevel', () => {
      const result = geohashService.getNeighborGeohashes('w4rq8p9q', 3, [])

      expect(result).toEqual({
        updatedGeohashesToProcess: [],
        updatedNeighborSearchLevel: 3
      })
      expect(getGeohashNthNeighbors).not.toHaveBeenCalled()
    })

    test('should get neighbors and continue recursion until max level', () => {
      const level1 = ['n1', 'n2']
      const level2 = ['n3', 'n4']
      const level3 = ['n5', 'n6']

      ;(getGeohashNthNeighbors as jest.Mock)
        .mockReturnValueOnce(level1)
        .mockReturnValueOnce(level2)
        .mockReturnValueOnce(level3)

      const result = geohashService.getNeighborGeohashes('w4rq8p9q', 0, [])

      expect(getGeohashNthNeighbors).toHaveBeenCalledWith('w4rq8p9q', 1)
      expect(getGeohashNthNeighbors).toHaveBeenCalledWith('w4rq8p9q', 2)
      expect(getGeohashNthNeighbors).toHaveBeenCalledWith('w4rq8p9q', 3)
      expect(result.updatedGeohashesToProcess).toEqual([...level1, ...level2, ...level3])
      expect(result.updatedNeighborSearchLevel).toBe(3)
    })

    test('should stop when reaching maxGeohashesPerExecution', () => {
      const mockNeighbors = Array(60).fill('neighbor')
      ;(getGeohashNthNeighbors as jest.Mock).mockReturnValue(mockNeighbors)

      const result = geohashService.getNeighborGeohashes('w4rq8p9q', 0, [])

      expect(result.updatedGeohashesToProcess).toHaveLength(60)
      expect(result.updatedNeighborSearchLevel).toBe(1)
    })

    test('should stop at max level even when called at that level', () => {
      const result = geohashService.getNeighborGeohashes('w4rq8p9q', 3, [])

      expect(result.updatedGeohashesToProcess).toEqual([])
      expect(result.updatedNeighborSearchLevel).toBe(3)
      expect(getGeohashNthNeighbors).not.toHaveBeenCalled()
    })

    test('should preserve existing geohashes when recursing', () => {
      const existingGeohashes = ['existing1', 'existing2']
      const level1 = ['new1', 'new2']
      const level2 = ['new3', 'new4']
      const level3 = ['new5', 'new6']

      ;(getGeohashNthNeighbors as jest.Mock)
        .mockReturnValueOnce(level1)
        .mockReturnValueOnce(level2)
        .mockReturnValueOnce(level3)

      const result = geohashService.getNeighborGeohashes(
        'w4rq8p9q',
        0,
        existingGeohashes
      )

      expect(result.updatedGeohashesToProcess).toEqual([
        ...existingGeohashes,
        ...level1,
        ...level2,
        ...level3
      ])
    })

    test('should call getGeohashNthNeighbors with incremented levels', () => {
      const level1 = ['n1']
      const level2 = ['n2']
      const level3 = ['n3']

      ;(getGeohashNthNeighbors as jest.Mock)
        .mockReturnValueOnce(level1)
        .mockReturnValueOnce(level2)
        .mockReturnValueOnce(level3)

      geohashService.getNeighborGeohashes('w4rq8p9q', 0, [])

      expect(getGeohashNthNeighbors).toHaveBeenNthCalledWith(1, 'w4rq8p9q', 1)
      expect(getGeohashNthNeighbors).toHaveBeenNthCalledWith(2, 'w4rq8p9q', 2)
      expect(getGeohashNthNeighbors).toHaveBeenNthCalledWith(3, 'w4rq8p9q', 3)
    })

    test('should handle when currentGeohashes length equals maxGeohashesPerExecution', () => {
      const currentGeohashes = Array(50).fill('existing')

      const result = geohashService.getNeighborGeohashes(
        'w4rq8p9q',
        0,
        currentGeohashes
      )

      expect(result.updatedGeohashesToProcess).toHaveLength(50)
      expect(result.updatedNeighborSearchLevel).toBe(0)
      expect(getGeohashNthNeighbors).not.toHaveBeenCalled()
    })

    test('should verify recursion stops at correct conditions', () => {
      const level1 = ['n1']
      const level2 = ['n2']
      const level3 = ['n3']

      ;(getGeohashNthNeighbors as jest.Mock)
        .mockReturnValueOnce(level1)
        .mockReturnValueOnce(level2)
        .mockReturnValueOnce(level3)

      const result = geohashService.getNeighborGeohashes('w4rq8p9q', 0, [])

      expect(getGeohashNthNeighbors).toHaveBeenCalledTimes(3)
      expect(result.updatedGeohashesToProcess).toEqual([...level1, ...level2, ...level3])
      expect(result.updatedNeighborSearchLevel).toBe(3)
    })

    test('should start from specified neighborLevel', () => {
      const level2 = ['n2']
      const level3 = ['n3']

      ;(getGeohashNthNeighbors as jest.Mock)
        .mockReturnValueOnce(level2)
        .mockReturnValueOnce(level3)

      const result = geohashService.getNeighborGeohashes('w4rq8p9q', 1, [])

      expect(getGeohashNthNeighbors).toHaveBeenNthCalledWith(1, 'w4rq8p9q', 2)
      expect(getGeohashNthNeighbors).toHaveBeenNthCalledWith(2, 'w4rq8p9q', 3)
      expect(result.updatedNeighborSearchLevel).toBe(3)
    })
  })
})
