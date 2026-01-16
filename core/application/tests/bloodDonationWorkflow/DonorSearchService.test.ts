import { DonorSearchService } from '../../bloodDonationWorkflow/DonorSearchService'
import { DonationStatus, DonorSearchStatus } from '../../../../commons/dto/DonationDTO'
import type { DonorSearchConfig, DynamoDBEventName } from '../../bloodDonationWorkflow/Types'
import { mockLogger } from '../mocks/mockLogger'
import type { QueueModel } from '../../models/queue/QueueModel'
import type { BloodDonationService } from '../../bloodDonationWorkflow/BloodDonationService'
import type { AcceptDonationService } from '../../bloodDonationWorkflow/AcceptDonationRequestService'
import type { NotificationService } from '../../notificationWorkflow/NotificationService'
import type { GeohashService } from '../../bloodDonationWorkflow/GeohashService'
import type { GeohashCacheManager, GeohashDonorMap } from '../../utils/GeohashCacheMapManager'
import { DonorSearchIntentionalError } from '../../bloodDonationWorkflow/DonorSearchOperationalError'

// Mock dependencies
jest.mock('../../utils/calculateDonorsToNotify', () => ({
  calculateDelayPeriod: jest.fn().mockReturnValue(1800),
  calculateTotalDonorsToFind: jest.fn().mockReturnValue(5)
}))

describe('DonorSearchService', () => {
  const mockDonorSearchRepository = {
    create: jest.fn(),
    update: jest.fn(),
    getDonorSearchItem: jest.fn()
  }

  const mockConfig: DonorSearchConfig = {
    dynamodbTableName: 'test-table',
    awsRegion: 'us-east-1',
    cacheGeohashPrefixLength: 6,
    maxGeohashCacheEntriesCount: 100,
    maxGeohashCacheMbSize: 10,
    maxGeohashCacheTimeoutMinutes: 30,
    maxGeohashNeighborSearchLevel: 3,
    donorSearchMaxInitiatingRetryCount: 5,
    neighborSearchGeohashPrefixLength: 5,
    donorSearchDelayBetweenExecution: 10,
    maxGeohashPerProcessingBatch: 10,
    maxGeohashesPerExecution: 5,
    donorSearchQueueUrl: 'https://queue.url',
    notificationQueueUrl: 'https://notification.queue.url'
  }

  const mockQueueModel = {
    queue: jest.fn(),
    updateVisibilityTimeout: jest.fn()
  } as unknown as jest.Mocked<QueueModel>

  const mockBloodDonationService = {
    getDonationRequest: jest.fn()
  } as unknown as jest.Mocked<BloodDonationService>

  const mockAcceptDonationService = {
    getRemainingBagsNeeded: jest.fn()
  } as unknown as jest.Mocked<AcceptDonationService>

  const mockNotificationService = {
    getRejectedDonorsCount: jest.fn(),
    sendRequestNotification: jest.fn()
  } as unknown as jest.Mocked<NotificationService>

  const mockGeohashService = {
    queryGeohash: jest.fn(),
    getNeighborGeohashes: jest.fn()
  } as unknown as jest.Mocked<GeohashService>

  const mockGeohashCache = {
    get: jest.fn(),
    set: jest.fn()
  } as unknown as jest.Mocked<GeohashCacheManager<string, GeohashDonorMap>>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('initiateDonorSearchRequest', () => {
    const donationRequestInitiatorAttributes = {
      seekerId: 'user123',
      requestPostId: 'req123',
      createdAt: '2024-01-01T00:00:00Z',
      geohash: 'wh0r35qr'
    }

    test('should create new donor search record and enqueue request when no existing record', async() => {
      // Arrange
      const donorSearchService = new DonorSearchService(
        mockDonorSearchRepository,
        mockLogger,
        mockConfig
      )
      mockDonorSearchRepository.getDonorSearchItem.mockResolvedValue(null)

      // Act
      await donorSearchService.initiateDonorSearchRequest(
        donationRequestInitiatorAttributes,
        mockQueueModel,
        DonationStatus.PENDING,
        'INSERT' as DynamoDBEventName
      )

      // Assert
      expect(mockDonorSearchRepository.create).toHaveBeenCalledWith({
        ...donationRequestInitiatorAttributes,
        status: DonorSearchStatus.PENDING,
        notifiedEligibleDonors: {}
      })

      expect(mockQueueModel.queue).toHaveBeenCalledWith(
        expect.objectContaining({
          seekerId: 'user123',
          requestPostId: 'req123',
          createdAt: '2024-01-01T00:00:00Z',
          currentNeighborSearchLevel: 0,
          remainingGeohashesToProcess: ['wh0r3'],
          notifiedEligibleDonors: {},
          initiationCount: 1
        }),
        mockConfig.donorSearchQueueUrl,
        undefined
      )
    })

    test('should update existing donor search record when record exists', async() => {
      // Arrange
      const donorSearchService = new DonorSearchService(
        mockDonorSearchRepository,
        mockLogger,
        mockConfig
      )
      const existingRecord = {
        ...donationRequestInitiatorAttributes,
        status: DonorSearchStatus.PENDING,
        notifiedEligibleDonors: { 'donor1': { locationId: 'loc1', distance: 5 } }
      }
      mockDonorSearchRepository.getDonorSearchItem.mockResolvedValue(existingRecord)

      // Act
      await donorSearchService.initiateDonorSearchRequest(
        donationRequestInitiatorAttributes,
        mockQueueModel,
        DonationStatus.PENDING,
        'MODIFY' as DynamoDBEventName
      )

      // Assert
      expect(mockDonorSearchRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          ...donationRequestInitiatorAttributes,
          status: DonorSearchStatus.PENDING,
          notifiedEligibleDonors: { 'donor1': { locationId: 'loc1', distance: 5 } }
        })
      )
      expect(mockQueueModel.queue).not.toHaveBeenCalled()
    })

    test('should restart search when donation status changed from COMPLETED to PENDING', async() => {
      // Arrange
      const donorSearchService = new DonorSearchService(
        mockDonorSearchRepository,
        mockLogger,
        mockConfig
      )
      const existingRecord = {
        ...donationRequestInitiatorAttributes,
        status: DonorSearchStatus.COMPLETED,
        notifiedEligibleDonors: { 'donor1': { locationId: 'loc1', distance: 5 } }
      }
      mockDonorSearchRepository.getDonorSearchItem.mockResolvedValue(existingRecord)

      // Act
      await donorSearchService.initiateDonorSearchRequest(
        donationRequestInitiatorAttributes,
        mockQueueModel,
        DonationStatus.PENDING,
        'MODIFY' as DynamoDBEventName
      )

      // Assert
      expect(mockDonorSearchRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: DonorSearchStatus.PENDING
        })
      )
      expect(mockQueueModel.queue).toHaveBeenCalled()
    })
  })

  describe('enqueueDonorSearchRequest', () => {
    test('should enqueue donor search request with delay', async() => {
      // Arrange
      const donorSearchService = new DonorSearchService(
        mockDonorSearchRepository,
        mockLogger,
        mockConfig
      )
      const donorSearchQueueAttributes = {
        seekerId: 'user123',
        requestPostId: 'req123',
        createdAt: '2024-01-01T00:00:00Z',
        currentNeighborSearchLevel: 0,
        remainingGeohashesToProcess: ['wh0r3'],
        notifiedEligibleDonors: {},
        initiationCount: 1
      }

      // Act
      await donorSearchService.enqueueDonorSearchRequest(
        donorSearchQueueAttributes,
        mockQueueModel,
        60
      )

      // Assert
      expect(mockQueueModel.queue).toHaveBeenCalledWith(
        donorSearchQueueAttributes,
        mockConfig.donorSearchQueueUrl,
        60
      )
    })
  })

  describe('searchDonors', () => {
    const searchParams = {
      seekerId: 'user123',
      requestPostId: 'req123',
      createdAt: '2024-01-01T00:00:00Z',
      currentNeighborSearchLevel: 0,
      remainingGeohashesToProcess: ['wh0r3'],
      initiationCount: 1,
      notifiedEligibleDonors: {},
      receiptHandle: 'receipt123',
      bloodDonationService: mockBloodDonationService,
      acceptDonationService: mockAcceptDonationService,
      notificationService: mockNotificationService,
      geohashService: mockGeohashService,
      queueModel: mockQueueModel,
      geohashCache: mockGeohashCache
    }

    const mockDonationPost = {
      seekerId: 'user123',
      requestPostId: 'req123',
      createdAt: '2024-01-01T00:00:00Z',
      status: DonationStatus.PENDING,
      bloodQuantity: 3,
      requestedBloodGroup: 'A+',
      urgencyLevel: 'urgent',
      donationDateTime: '2024-01-10T00:00:00Z',
      countryCode: 'BD',
      geohash: 'wh0r35qr',
      location: 'Dhaka',
      contactNumber: '+8801234567890',
      patientName: 'Patient',
      transportationInfo: 'Available',
      shortDescription: 'Emergency',
      seekerName: 'Seeker'
    }

    test('should terminate process when donation status is COMPLETED', async() => {
      // Arrange
      const donorSearchService = new DonorSearchService(
        mockDonorSearchRepository,
        mockLogger,
        mockConfig
      )
      mockBloodDonationService.getDonationRequest.mockResolvedValue({
        ...mockDonationPost,
        status: DonationStatus.COMPLETED
      })

      // Act
      await donorSearchService.searchDonors(searchParams)

      // Assert
      expect(mockDonorSearchRepository.getDonorSearchItem).not.toHaveBeenCalled()
      expect(mockNotificationService.sendRequestNotification).not.toHaveBeenCalled()
    })

    test('should terminate process when donation status is CANCELLED', async() => {
      // Arrange
      const donorSearchService = new DonorSearchService(
        mockDonorSearchRepository,
        mockLogger,
        mockConfig
      )
      mockBloodDonationService.getDonationRequest.mockResolvedValue({
        ...mockDonationPost,
        status: DonationStatus.CANCELLED
      })

      // Act
      await donorSearchService.searchDonors(searchParams)

      // Assert
      expect(mockDonorSearchRepository.getDonorSearchItem).not.toHaveBeenCalled()
    })

    test('should terminate process when no donor search record found', async() => {
      // Arrange
      const donorSearchService = new DonorSearchService(
        mockDonorSearchRepository,
        mockLogger,
        mockConfig
      )
      mockBloodDonationService.getDonationRequest.mockResolvedValue(mockDonationPost)
      mockDonorSearchRepository.getDonorSearchItem.mockResolvedValue(null)

      // Act
      await donorSearchService.searchDonors(searchParams)

      // Assert
      expect(mockNotificationService.sendRequestNotification).not.toHaveBeenCalled()
    })

    test('should terminate process when sufficient donors have accepted (first initiation check)', async() => {
      // Arrange
      const donorSearchService = new DonorSearchService(
        mockDonorSearchRepository,
        mockLogger,
        mockConfig
      )
      mockBloodDonationService.getDonationRequest.mockResolvedValue(mockDonationPost)
      mockDonorSearchRepository.getDonorSearchItem.mockResolvedValue({
        seekerId: 'user123',
        requestPostId: 'req123',
        createdAt: '2024-01-01T00:00:00Z',
        status: DonorSearchStatus.PENDING,
        notifiedEligibleDonors: {}
      })
      // For first initiation (initiationCount === 1), it uses bloodQuantity directly
      // So we need to test with initiationCount > 1 to trigger getRemainingBagsNeeded check
      mockAcceptDonationService.getRemainingBagsNeeded.mockResolvedValue(0)
      mockNotificationService.getRejectedDonorsCount.mockResolvedValue(0)
      mockGeohashService.getNeighborGeohashes.mockReturnValue({
        updatedGeohashesToProcess: ['wh0r3'],
        updatedNeighborSearchLevel: 1
      })
      mockGeohashService.queryGeohash.mockResolvedValue([])
      mockGeohashCache.get
        .mockReturnValueOnce(undefined)
        .mockReturnValue({ 'wh0r3': [] })

      // Act - Use initiationCount > 1 to test remaining bags logic
      await donorSearchService.searchDonors({
        ...searchParams,
        initiationCount: 2
      })

      // Assert
      expect(mockAcceptDonationService.getRemainingBagsNeeded).toHaveBeenCalled()
      expect(mockNotificationService.sendRequestNotification).not.toHaveBeenCalled()
    })

    test('should find donors and send notifications', async() => {
      // Arrange
      const donorSearchService = new DonorSearchService(
        mockDonorSearchRepository,
        mockLogger,
        mockConfig
      )
      mockBloodDonationService.getDonationRequest.mockResolvedValue(mockDonationPost)
      mockDonorSearchRepository.getDonorSearchItem.mockResolvedValue({
        seekerId: 'user123',
        requestPostId: 'req123',
        createdAt: '2024-01-01T00:00:00Z',
        status: DonorSearchStatus.PENDING,
        notifiedEligibleDonors: {}
      })
      mockAcceptDonationService.getRemainingBagsNeeded.mockResolvedValue(3)
      mockNotificationService.getRejectedDonorsCount.mockResolvedValue(0)
      mockGeohashService.getNeighborGeohashes.mockReturnValue({
        updatedGeohashesToProcess: ['wh0r3', 'wh0r4'],
        updatedNeighborSearchLevel: 1
      })
      mockGeohashCache.get.mockReturnValue({
        'wh0r3': [{ userId: 'donor1', locationId: 'loc1' }]
      })

      // Act
      await donorSearchService.searchDonors(searchParams)

      // Assert
      expect(mockNotificationService.sendRequestNotification).toHaveBeenCalledWith(
        mockDonationPost,
        expect.any(Object),
        mockQueueModel,
        mockConfig.notificationQueueUrl
      )
    })

    test('should continue search when more donors needed', async() => {
      // Arrange
      const donorSearchService = new DonorSearchService(
        mockDonorSearchRepository,
        mockLogger,
        mockConfig
      )
      mockBloodDonationService.getDonationRequest.mockResolvedValue(mockDonationPost)
      mockDonorSearchRepository.getDonorSearchItem.mockResolvedValue({
        seekerId: 'user123',
        requestPostId: 'req123',
        createdAt: '2024-01-01T00:00:00Z',
        status: DonorSearchStatus.PENDING,
        notifiedEligibleDonors: {}
      })
      mockAcceptDonationService.getRemainingBagsNeeded.mockResolvedValue(3)
      mockNotificationService.getRejectedDonorsCount.mockResolvedValue(0)
      mockGeohashService.getNeighborGeohashes.mockReturnValue({
        updatedGeohashesToProcess: ['wh0r3', 'wh0r4', 'wh0r5', 'wh0r6'],
        updatedNeighborSearchLevel: 1
      })
      mockGeohashCache.get.mockReturnValue({
        'wh0r3': [{ userId: 'donor1', locationId: 'loc1' }]
      })

      // Act
      await donorSearchService.searchDonors(searchParams)

      // Assert
      expect(mockQueueModel.queue).toHaveBeenCalledWith(
        expect.objectContaining({
          seekerId: 'user123',
          currentNeighborSearchLevel: 1,
          initiationCount: 1
        }),
        mockConfig.donorSearchQueueUrl,
        mockConfig.donorSearchDelayBetweenExecution
      )
    })

    test('should complete search when max geohash level reached', async() => {
      // Arrange
      const donorSearchService = new DonorSearchService(
        mockDonorSearchRepository,
        mockLogger,
        mockConfig
      )
      mockBloodDonationService.getDonationRequest.mockResolvedValue(mockDonationPost)
      mockDonorSearchRepository.getDonorSearchItem.mockResolvedValue({
        seekerId: 'user123',
        requestPostId: 'req123',
        createdAt: '2024-01-01T00:00:00Z',
        status: DonorSearchStatus.PENDING,
        notifiedEligibleDonors: {}
      })
      mockAcceptDonationService.getRemainingBagsNeeded.mockResolvedValue(3)
      mockNotificationService.getRejectedDonorsCount.mockResolvedValue(0)
      mockGeohashService.getNeighborGeohashes.mockReturnValue({
        updatedGeohashesToProcess: [],
        updatedNeighborSearchLevel: 3
      })
      mockGeohashCache.get.mockReturnValue({
        'wh0r3': [{ userId: 'donor1', locationId: 'loc1' }]
      })

      // Act
      await donorSearchService.searchDonors({
        ...searchParams,
        initiationCount: 5
      })

      // Assert
      expect(mockDonorSearchRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: DonorSearchStatus.COMPLETED
        })
      )
    })
  })

  describe('handleVisibilityTimeout', () => {
    test('should update visibility timeout and throw error when targeted execution time is in future', async() => {
      // Arrange
      const donorSearchService = new DonorSearchService(
        mockDonorSearchRepository,
        mockLogger,
        mockConfig
      )
      const futureTime = Math.floor(Date.now() / 1000) + 3600

      // Act & Assert
      await expect(
        donorSearchService.handleVisibilityTimeout(
          mockQueueModel,
          futureTime,
          'receipt123'
        )
      ).rejects.toThrow(DonorSearchIntentionalError)

      expect(mockQueueModel.updateVisibilityTimeout).toHaveBeenCalledWith(
        'receipt123',
        mockConfig.donorSearchQueueUrl,
        expect.any(Number)
      )
    })

    test('should not update visibility timeout when targeted execution time is in past', async() => {
      // Arrange
      const donorSearchService = new DonorSearchService(
        mockDonorSearchRepository,
        mockLogger,
        mockConfig
      )
      const pastTime = Math.floor(Date.now() / 1000) - 3600

      // Act
      await donorSearchService.handleVisibilityTimeout(
        mockQueueModel,
        pastTime,
        'receipt123'
      )

      // Assert
      expect(mockQueueModel.updateVisibilityTimeout).not.toHaveBeenCalled()
    })

    test('should not update when targeted execution time is undefined', async() => {
      // Arrange
      const donorSearchService = new DonorSearchService(
        mockDonorSearchRepository,
        mockLogger,
        mockConfig
      )

      // Act
      await donorSearchService.handleVisibilityTimeout(
        mockQueueModel,
        undefined,
        'receipt123'
      )

      // Assert
      expect(mockQueueModel.updateVisibilityTimeout).not.toHaveBeenCalled()
    })
  })

  describe('getDonorSearch', () => {
    test('should retrieve donor search record', async() => {
      // Arrange
      const donorSearchService = new DonorSearchService(
        mockDonorSearchRepository,
        mockLogger,
        mockConfig
      )
      const expectedRecord = {
        seekerId: 'user123',
        requestPostId: 'req123',
        createdAt: '2024-01-01T00:00:00Z',
        status: DonorSearchStatus.PENDING,
        notifiedEligibleDonors: {}
      }
      mockDonorSearchRepository.getDonorSearchItem.mockResolvedValue(expectedRecord)

      // Act
      const result = await donorSearchService.getDonorSearch(
        'user123',
        'req123',
        '2024-01-01T00:00:00Z'
      )

      // Assert
      expect(result).toEqual(expectedRecord)
      expect(mockDonorSearchRepository.getDonorSearchItem).toHaveBeenCalledWith(
        'user123',
        'req123',
        '2024-01-01T00:00:00Z'
      )
    })
  })

  describe('createDonorSearchRecord', () => {
    test('should create donor search record', async() => {
      // Arrange
      const donorSearchService = new DonorSearchService(
        mockDonorSearchRepository,
        mockLogger,
        mockConfig
      )
      const donorSearchAttributes = {
        seekerId: 'user123',
        requestPostId: 'req123',
        createdAt: '2024-01-01T00:00:00Z',
        status: DonorSearchStatus.PENDING,
        notifiedEligibleDonors: {}
      }

      // Act
      await donorSearchService.createDonorSearchRecord(donorSearchAttributes)

      // Assert
      expect(mockDonorSearchRepository.create).toHaveBeenCalledWith(donorSearchAttributes)
    })
  })

  describe('updateDonorSearchRecord', () => {
    test('should update donor search record', async() => {
      // Arrange
      const donorSearchService = new DonorSearchService(
        mockDonorSearchRepository,
        mockLogger,
        mockConfig
      )
      const updateAttributes = {
        seekerId: 'user123',
        requestPostId: 'req123',
        status: DonorSearchStatus.COMPLETED
      }

      // Act
      await donorSearchService.updateDonorSearchRecord(updateAttributes)

      // Assert
      expect(mockDonorSearchRepository.update).toHaveBeenCalledWith(updateAttributes)
    })
  })

  describe('queryEligibleDonors', () => {
    test('should query eligible donors and return results', async() => {
      // Arrange
      const donorSearchService = new DonorSearchService(
        mockDonorSearchRepository,
        mockLogger,
        mockConfig
      )
      mockGeohashService.getNeighborGeohashes.mockReturnValue({
        updatedGeohashesToProcess: ['wh0r3', 'wh0r4'],
        updatedNeighborSearchLevel: 1
      })
      mockGeohashCache.get.mockReturnValue({
        'wh0r3': [{ userId: 'donor1', locationId: 'loc1' }]
      })

      // Act
      const result = await donorSearchService.queryEligibleDonors(
        mockGeohashService,
        mockGeohashCache,
        'user123',
        'A+',
        'BD',
        'wh0r35qr',
        5,
        0,
        ['wh0r3'],
        {}
      )

      // Assert
      expect(result).toHaveProperty('eligibleDonors')
      expect(result).toHaveProperty('updatedNeighborSearchLevel', 1)
      expect(result).toHaveProperty('geohashesForNextIteration')
    })
  })

  describe('getNewDonorsInNeighborGeohash', () => {
    test('should return empty when all geohashes processed', async() => {
      // Arrange
      const donorSearchService = new DonorSearchService(
        mockDonorSearchRepository,
        mockLogger,
        mockConfig
      )

      // Act
      const result = await donorSearchService.getNewDonorsInNeighborGeohash(
        mockGeohashService,
        mockGeohashCache,
        'user123',
        'A+',
        'BD',
        'wh0r35qr',
        [],
        5,
        {},
        0,
        {}
      )

      // Assert
      expect(result.updatedEligibleDonors).toEqual({})
      expect(result.processedGeohashCount).toBe(0)
    })

    test('should exclude seeker from eligible donors', async() => {
      // Arrange
      const donorSearchService = new DonorSearchService(
        mockDonorSearchRepository,
        mockLogger,
        mockConfig
      )
      mockGeohashCache.get.mockReturnValue({
        'wh0r3': [
          { userId: 'user123', locationId: 'loc1' },
          { userId: 'donor1', locationId: 'loc2' }
        ]
      })
      mockGeohashService.queryGeohash.mockResolvedValue([])

      // Act
      const result = await donorSearchService.getNewDonorsInNeighborGeohash(
        mockGeohashService,
        mockGeohashCache,
        'user123',
        'A+',
        'BD',
        'wh0r35qr',
        ['wh0r3'],
        5,
        {},
        0,
        {}
      )

      // Assert
      expect(result.updatedEligibleDonors['user123']).toBeUndefined()
      expect(result.updatedEligibleDonors['donor1']).toBeDefined()
    })

    test('should exclude already notified donors', async() => {
      // Arrange
      const donorSearchService = new DonorSearchService(
        mockDonorSearchRepository,
        mockLogger,
        mockConfig
      )
      mockGeohashCache.get.mockReturnValue({
        'wh0r3': [
          { userId: 'donor1', locationId: 'loc1' },
          { userId: 'donor2', locationId: 'loc2' }
        ]
      })
      mockGeohashService.queryGeohash.mockResolvedValue([])

      // Act
      const result = await donorSearchService.getNewDonorsInNeighborGeohash(
        mockGeohashService,
        mockGeohashCache,
        'user123',
        'A+',
        'BD',
        'wh0r35qr',
        ['wh0r3'],
        5,
        { 'donor1': { locationId: 'loc1', distance: 5 } },
        0,
        {}
      )

      // Assert
      expect(result.updatedEligibleDonors['donor1']).toBeUndefined()
      expect(result.updatedEligibleDonors['donor2']).toBeDefined()
    })

    test('should stop processing when max geohashes limit reached', async() => {
      // Arrange
      const donorSearchService = new DonorSearchService(
        mockDonorSearchRepository,
        mockLogger,
        mockConfig
      )
      mockGeohashCache.get.mockReturnValue({})

      // Act
      const result = await donorSearchService.getNewDonorsInNeighborGeohash(
        mockGeohashService,
        mockGeohashCache,
        'user123',
        'A+',
        'BD',
        'wh0r35qr',
        ['g1', 'g2', 'g3', 'g4', 'g5', 'g6'],
        5,
        {},
        5,
        {}
      )

      // Assert
      expect(result.processedGeohashCount).toBe(5)
    })

    test('should stop processing when enough donors found', async() => {
      // Arrange
      const donorSearchService = new DonorSearchService(
        mockDonorSearchRepository,
        mockLogger,
        mockConfig
      )
      mockGeohashCache.get.mockReturnValue({
        'wh0r3': Array(5).fill(null).map((_, i) => ({
          userId: `donor${i}`,
          locationId: `loc${i}`
        }))
      })
      mockGeohashService.queryGeohash.mockResolvedValue([])

      // Act
      const result = await donorSearchService.getNewDonorsInNeighborGeohash(
        mockGeohashService,
        mockGeohashCache,
        'user123',
        'A+',
        'BD',
        'wh0r35qr',
        ['wh0r3', 'wh0r4'],
        5,
        {},
        0,
        {}
      )

      // Assert
      expect(Object.keys(result.updatedEligibleDonors).length).toBeGreaterThanOrEqual(5)
      expect(result.processedGeohashCount).toBeGreaterThan(0)
    })
  })

  describe('getDonorsFromCache', () => {
    test('should return donors from cache when available', async() => {
      // Arrange
      const donorSearchService = new DonorSearchService(
        mockDonorSearchRepository,
        mockLogger,
        mockConfig
      )
      const cachedDonors = {
        'wh0r3': [{ userId: 'donor1', locationId: 'loc1' }]
      }
      mockGeohashCache.get.mockReturnValue(cachedDonors)

      // Act
      const result = await donorSearchService.getDonorsFromCache(
        mockGeohashService,
        mockGeohashCache,
        'wh0r3',
        'BD',
        'A+'
      )

      // Assert
      expect(result).toEqual([{ userId: 'donor1', locationId: 'loc1' }])
      expect(mockGeohashService.queryGeohash).not.toHaveBeenCalled()
    })

    test('should query and cache when not in cache', async() => {
      // Arrange
      const donorSearchService = new DonorSearchService(
        mockDonorSearchRepository,
        mockLogger,
        mockConfig
      )
      mockGeohashCache.get
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce({
          'wh0r3': [{ userId: 'donor1', locationId: 'loc1' }]
        })
      mockGeohashService.queryGeohash.mockResolvedValue([
        {
          userId: 'donor1',
          locationId: 'loc1',
          geohash: 'wh0r3xyz',
          countryCode: 'BD',
          bloodGroup: 'A+'
        }
      ])

      // Act
      const result = await donorSearchService.getDonorsFromCache(
        mockGeohashService,
        mockGeohashCache,
        'wh0r3',
        'BD',
        'A+'
      )

      // Assert
      expect(mockGeohashService.queryGeohash).toHaveBeenCalledWith('BD', 'A+', 'wh0r3')
      expect(mockGeohashCache.set).toHaveBeenCalled()
      expect(result).toEqual([{ userId: 'donor1', locationId: 'loc1' }])
    })

    test('should return empty array when geohash not in cache', async() => {
      // Arrange
      const donorSearchService = new DonorSearchService(
        mockDonorSearchRepository,
        mockLogger,
        mockConfig
      )
      mockGeohashCache.get.mockReturnValue({})

      // Act
      const result = await donorSearchService.getDonorsFromCache(
        mockGeohashService,
        mockGeohashCache,
        'wh0r35',
        'BD',
        'A+'
      )

      // Assert
      expect(result).toEqual([])
    })
  })
})
