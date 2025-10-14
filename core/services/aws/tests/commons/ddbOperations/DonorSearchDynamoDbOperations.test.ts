import DonorSearchDynamoDbOperations from '../../../commons/ddbOperations/DonorSearchDynamoDbOperations'
import DynamoDbTableOperations from '../../../commons/ddbOperations/DynamoDbTableOperations'
import type { DonorSearchDTO } from '../../../../../../commons/dto/DonationDTO'
import { DonorSearchStatus } from '../../../../../../commons/dto/DonationDTO'
import { DONOR_SEARCH_PK_PREFIX } from '../../../commons/ddbModels/DonorSearchModel'

jest.mock('../../../commons/ddbOperations/DynamoDbTableOperations')

describe('DonorSearchDynamoDbOperations', () => {
  let donorSearchDynamoDbOperations: DonorSearchDynamoDbOperations
  const mockTableName = 'test-donor-search-table'
  const mockRegion = 'us-east-1'

  beforeEach(() => {
    jest.clearAllMocks()
    donorSearchDynamoDbOperations = new DonorSearchDynamoDbOperations(
      mockTableName,
      mockRegion
    )
  })

  describe('constructor', () => {
    it('should initialize with correct table name and region', () => {
      expect(donorSearchDynamoDbOperations).toBeInstanceOf(DonorSearchDynamoDbOperations)
      expect(donorSearchDynamoDbOperations).toBeInstanceOf(DynamoDbTableOperations)
    })

    it('should initialize with DonorSearchModel adapter', () => {
      const newInstance = new DonorSearchDynamoDbOperations(mockTableName, mockRegion)
      expect(newInstance).toBeDefined()
    })
  })

  describe('getDonorSearchItem', () => {
    const seekerId = 'seeker-123'
    const requestPostId = 'request-456'
    const createdAt = '2024-01-15T10:00:00.000Z'

    it('should successfully get a donor search item', async () => {
      const mockDonorSearch: DonorSearchDTO = {
        id: 'search-1',
        seekerId,
        requestPostId,
        createdAt,
        status: DonorSearchStatus.PENDING,
        notifiedEligibleDonors: {
          'donor-1': {
            distance: 2.5,
            locationId: 'loc-1'
          },
          'donor-2': {
            distance: 3.8,
            locationId: 'loc-2'
          }
        }
      }

      const mockGetItem = jest.fn().mockResolvedValue(mockDonorSearch)
      DynamoDbTableOperations.prototype.getItem = mockGetItem

      const result = await donorSearchDynamoDbOperations.getDonorSearchItem(
        seekerId,
        requestPostId,
        createdAt
      )

      expect(result).toEqual(mockDonorSearch)
      expect(mockGetItem).toHaveBeenCalledWith(
        `${DONOR_SEARCH_PK_PREFIX}#${seekerId}`,
        `${DONOR_SEARCH_PK_PREFIX}#${createdAt}#${requestPostId}`
      )
      expect(mockGetItem).toHaveBeenCalledTimes(1)
    })

    it('should return null when donor search item does not exist', async () => {
      const mockGetItem = jest.fn().mockResolvedValue(null)
      DynamoDbTableOperations.prototype.getItem = mockGetItem

      const result = await donorSearchDynamoDbOperations.getDonorSearchItem(
        seekerId,
        requestPostId,
        createdAt
      )

      expect(result).toBeNull()
      expect(mockGetItem).toHaveBeenCalledWith(
        `${DONOR_SEARCH_PK_PREFIX}#${seekerId}`,
        `${DONOR_SEARCH_PK_PREFIX}#${createdAt}#${requestPostId}`
      )
    })

    it('should format partition key correctly with seeker ID', async () => {
      const mockGetItem = jest.fn().mockResolvedValue(null)
      DynamoDbTableOperations.prototype.getItem = mockGetItem

      await donorSearchDynamoDbOperations.getDonorSearchItem(
        'test-seeker-id',
        requestPostId,
        createdAt
      )

      expect(mockGetItem).toHaveBeenCalledWith(
        `${DONOR_SEARCH_PK_PREFIX}#test-seeker-id`,
        expect.any(String)
      )
    })

    it('should format sort key correctly with createdAt and request post ID', async () => {
      const mockGetItem = jest.fn().mockResolvedValue(null)
      DynamoDbTableOperations.prototype.getItem = mockGetItem

      await donorSearchDynamoDbOperations.getDonorSearchItem(
        seekerId,
        'post-123',
        '2024-01-20T15:30:00.000Z'
      )

      expect(mockGetItem).toHaveBeenCalledWith(
        expect.any(String),
        `${DONOR_SEARCH_PK_PREFIX}#2024-01-20T15:30:00.000Z#post-123`
      )
    })

    it('should handle donor search with PENDING status', async () => {
      const mockDonorSearch: DonorSearchDTO = {
        id: 'search-1',
        seekerId,
        requestPostId,
        createdAt,
        status: DonorSearchStatus.PENDING,
        notifiedEligibleDonors: {}
      }

      const mockGetItem = jest.fn().mockResolvedValue(mockDonorSearch)
      DynamoDbTableOperations.prototype.getItem = mockGetItem

      const result = await donorSearchDynamoDbOperations.getDonorSearchItem(
        seekerId,
        requestPostId,
        createdAt
      )

      expect(result?.status).toBe(DonorSearchStatus.PENDING)
    })

    it('should handle donor search with COMPLETED status', async () => {
      const mockDonorSearch: DonorSearchDTO = {
        id: 'search-2',
        seekerId,
        requestPostId,
        createdAt,
        status: DonorSearchStatus.COMPLETED,
        notifiedEligibleDonors: {
          'donor-1': {
            distance: 1.2,
            locationId: 'loc-1'
          }
        }
      }

      const mockGetItem = jest.fn().mockResolvedValue(mockDonorSearch)
      DynamoDbTableOperations.prototype.getItem = mockGetItem

      const result = await donorSearchDynamoDbOperations.getDonorSearchItem(
        seekerId,
        requestPostId,
        createdAt
      )

      expect(result?.status).toBe(DonorSearchStatus.COMPLETED)
    })

    it('should handle empty notifiedEligibleDonors', async () => {
      const mockDonorSearch: DonorSearchDTO = {
        id: 'search-3',
        seekerId,
        requestPostId,
        createdAt,
        status: DonorSearchStatus.PENDING,
        notifiedEligibleDonors: {}
      }

      const mockGetItem = jest.fn().mockResolvedValue(mockDonorSearch)
      DynamoDbTableOperations.prototype.getItem = mockGetItem

      const result = await donorSearchDynamoDbOperations.getDonorSearchItem(
        seekerId,
        requestPostId,
        createdAt
      )

      expect(result?.notifiedEligibleDonors).toEqual({})
    })

    it('should handle multiple notified eligible donors', async () => {
      const mockDonorSearch: DonorSearchDTO = {
        id: 'search-4',
        seekerId,
        requestPostId,
        createdAt,
        status: DonorSearchStatus.PENDING,
        notifiedEligibleDonors: {
          'donor-1': { distance: 1.5, locationId: 'loc-1' },
          'donor-2': { distance: 2.0, locationId: 'loc-2' },
          'donor-3': { distance: 3.2, locationId: 'loc-3' },
          'donor-4': { distance: 4.8, locationId: 'loc-4' },
          'donor-5': { distance: 5.5, locationId: 'loc-5' }
        }
      }

      const mockGetItem = jest.fn().mockResolvedValue(mockDonorSearch)
      DynamoDbTableOperations.prototype.getItem = mockGetItem

      const result = await donorSearchDynamoDbOperations.getDonorSearchItem(
        seekerId,
        requestPostId,
        createdAt
      )

      expect(Object.keys(result?.notifiedEligibleDonors ?? {})).toHaveLength(5)
      expect(result?.notifiedEligibleDonors?.['donor-1'].distance).toBe(1.5)
      expect(result?.notifiedEligibleDonors?.['donor-5'].locationId).toBe('loc-5')
    })

    it('should handle donor search with distance information', async () => {
      const mockDonorSearch: DonorSearchDTO = {
        id: 'search-5',
        seekerId,
        requestPostId,
        createdAt,
        status: DonorSearchStatus.PENDING,
        notifiedEligibleDonors: {
          'donor-1': {
            distance: 0.5,
            locationId: 'loc-1'
          }
        }
      }

      const mockGetItem = jest.fn().mockResolvedValue(mockDonorSearch)
      DynamoDbTableOperations.prototype.getItem = mockGetItem

      const result = await donorSearchDynamoDbOperations.getDonorSearchItem(
        seekerId,
        requestPostId,
        createdAt
      )

      expect(result?.notifiedEligibleDonors?.['donor-1'].distance).toBe(0.5)
    })

    it('should handle donor search with location ID information', async () => {
      const mockDonorSearch: DonorSearchDTO = {
        id: 'search-6',
        seekerId,
        requestPostId,
        createdAt,
        status: DonorSearchStatus.PENDING,
        notifiedEligibleDonors: {
          'donor-1': {
            distance: 2.5,
            locationId: 'location-abc-123'
          }
        }
      }

      const mockGetItem = jest.fn().mockResolvedValue(mockDonorSearch)
      DynamoDbTableOperations.prototype.getItem = mockGetItem

      const result = await donorSearchDynamoDbOperations.getDonorSearchItem(
        seekerId,
        requestPostId,
        createdAt
      )

      expect(result?.notifiedEligibleDonors?.['donor-1'].locationId).toBe('location-abc-123')
    })

    it('should handle different seeker IDs', async () => {
      const seekerIds = ['seeker-1', 'seeker-2', 'seeker-3']
      const mockGetItem = jest.fn().mockResolvedValue(null)
      DynamoDbTableOperations.prototype.getItem = mockGetItem

      for (const id of seekerIds) {
        mockGetItem.mockClear()

        await donorSearchDynamoDbOperations.getDonorSearchItem(id, requestPostId, createdAt)

        expect(mockGetItem).toHaveBeenCalledWith(
          `${DONOR_SEARCH_PK_PREFIX}#${id}`,
          expect.any(String)
        )
      }
    })

    it('should handle different request post IDs', async () => {
      const postIds = ['post-1', 'post-2', 'post-3']
      const mockGetItem = jest.fn().mockResolvedValue(null)
      DynamoDbTableOperations.prototype.getItem = mockGetItem

      for (const id of postIds) {
        mockGetItem.mockClear()

        await donorSearchDynamoDbOperations.getDonorSearchItem(seekerId, id, createdAt)

        expect(mockGetItem).toHaveBeenCalledWith(
          expect.any(String),
          `${DONOR_SEARCH_PK_PREFIX}#${createdAt}#${id}`
        )
      }
    })

    it('should handle different timestamps', async () => {
      const timestamps = [
        '2024-01-15T10:00:00.000Z',
        '2024-01-16T15:30:45.123Z',
        '2024-02-01T08:00:00.000Z'
      ]
      const mockGetItem = jest.fn().mockResolvedValue(null)
      DynamoDbTableOperations.prototype.getItem = mockGetItem

      for (const timestamp of timestamps) {
        mockGetItem.mockClear()

        await donorSearchDynamoDbOperations.getDonorSearchItem(seekerId, requestPostId, timestamp)

        expect(mockGetItem).toHaveBeenCalledWith(
          expect.any(String),
          `${DONOR_SEARCH_PK_PREFIX}#${timestamp}#${requestPostId}`
        )
      }
    })

    it('should use super.getItem with correct parameters', async () => {
      const mockGetItem = jest.fn().mockResolvedValue(null)
      DynamoDbTableOperations.prototype.getItem = mockGetItem

      await donorSearchDynamoDbOperations.getDonorSearchItem(seekerId, requestPostId, createdAt)

      expect(mockGetItem).toHaveBeenCalledTimes(1)
      expect(mockGetItem).toHaveBeenCalledWith(
        `${DONOR_SEARCH_PK_PREFIX}#${seekerId}`,
        `${DONOR_SEARCH_PK_PREFIX}#${createdAt}#${requestPostId}`
      )
    })

    it('should handle getItem returning undefined', async () => {
      const mockGetItem = jest.fn().mockResolvedValue(undefined)
      DynamoDbTableOperations.prototype.getItem = mockGetItem

      const result = await donorSearchDynamoDbOperations.getDonorSearchItem(
        seekerId,
        requestPostId,
        createdAt
      )

      expect(result).toBeUndefined()
    })

    it('should propagate errors from getItem', async () => {
      const mockGetItem = jest.fn().mockRejectedValue(new Error('Database error'))
      DynamoDbTableOperations.prototype.getItem = mockGetItem

      await expect(
        donorSearchDynamoDbOperations.getDonorSearchItem(seekerId, requestPostId, createdAt)
      ).rejects.toThrow('Database error')
    })

    it('should handle donor search with decimal distance values', async () => {
      const mockDonorSearch: DonorSearchDTO = {
        id: 'search-7',
        seekerId,
        requestPostId,
        createdAt,
        status: DonorSearchStatus.PENDING,
        notifiedEligibleDonors: {
          'donor-1': { distance: 1.234567, locationId: 'loc-1' },
          'donor-2': { distance: 10.999999, locationId: 'loc-2' }
        }
      }

      const mockGetItem = jest.fn().mockResolvedValue(mockDonorSearch)
      DynamoDbTableOperations.prototype.getItem = mockGetItem

      const result = await donorSearchDynamoDbOperations.getDonorSearchItem(
        seekerId,
        requestPostId,
        createdAt
      )

      expect(result?.notifiedEligibleDonors?.['donor-1'].distance).toBe(1.234567)
      expect(result?.notifiedEligibleDonors?.['donor-2'].distance).toBe(10.999999)
    })

    it('should handle sort key with proper format: prefix#timestamp#requestPostId', async () => {
      const customCreatedAt = '2024-03-15T12:30:45.678Z'
      const customPostId = 'custom-post-789'

      const mockGetItem = jest.fn().mockResolvedValue(null)
      DynamoDbTableOperations.prototype.getItem = mockGetItem

      await donorSearchDynamoDbOperations.getDonorSearchItem(
        seekerId,
        customPostId,
        customCreatedAt
      )

      expect(mockGetItem).toHaveBeenCalledWith(
        expect.any(String),
        `${DONOR_SEARCH_PK_PREFIX}#${customCreatedAt}#${customPostId}`
      )
    })

    it('should maintain correct order of parameters in sort key', async () => {
      const mockGetItem = jest.fn().mockResolvedValue(null)
      DynamoDbTableOperations.prototype.getItem = mockGetItem

      await donorSearchDynamoDbOperations.getDonorSearchItem(
        'seeker-abc',
        'post-xyz',
        '2024-01-01T00:00:00.000Z'
      )

      const sortKey = mockGetItem.mock.calls[0][1]
      expect(sortKey).toBe(`${DONOR_SEARCH_PK_PREFIX}#2024-01-01T00:00:00.000Z#post-xyz`)

      // Verify order: prefix, then createdAt, then requestPostId
      const parts = sortKey.split('#')
      expect(parts[0]).toBe(DONOR_SEARCH_PK_PREFIX)
      expect(parts[1]).toBe('2024-01-01T00:00:00.000Z')
      expect(parts[2]).toBe('post-xyz')
    })
  })

  describe('key prefix constant', () => {
    it('should use DONOR_SEARCH as prefix', () => {
      expect(DONOR_SEARCH_PK_PREFIX).toBe('DONOR_SEARCH')
    })
  })
})
