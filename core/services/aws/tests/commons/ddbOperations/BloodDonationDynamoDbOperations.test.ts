import BloodDonationDynamoDbOperations from '../../../commons/ddbOperations/BloodDonationDynamoDbOperations'
import DynamoDbTableOperations from '../../../commons/ddbOperations/DynamoDbTableOperations'
import { BLOOD_REQUEST_PK_PREFIX } from '../../../commons/ddbModels/BloodDonationModel'
import type { DonationDTO } from '../../../../../../commons/dto/DonationDTO'
import { DonationStatus } from '../../../../../../commons/dto/DonationDTO'
import { QueryConditionOperator } from '../../../../../application/models/policies/repositories/QueryTypes'

jest.mock('../../../commons/ddbOperations/DynamoDbTableOperations')

describe('BloodDonationDynamoDbOperations', () => {
  let bloodDonationDynamoDbOperations: BloodDonationDynamoDbOperations
  const mockTableName = 'test-table'
  const mockRegion = 'us-east-1'

  beforeEach(() => {
    jest.clearAllMocks()
    bloodDonationDynamoDbOperations = new BloodDonationDynamoDbOperations(
      mockTableName,
      mockRegion
    )
  })

  describe('constructor', () => {
    it('should initialize with correct table name and region', () => {
      expect(bloodDonationDynamoDbOperations).toBeInstanceOf(BloodDonationDynamoDbOperations)
      expect(bloodDonationDynamoDbOperations).toBeInstanceOf(DynamoDbTableOperations)
    })
  })

  describe('getDonationRequest', () => {
    it('should successfully get donation request', async () => {
      const seekerId = 'test-seeker-id'
      const requestPostId = 'test-request-post-id'
      const createdAt = '2024-01-01T00:00:00.000Z'

      const mockDonation: DonationDTO = {
        seekerId,
        requestPostId,
        createdAt,
        bloodGroup: 'A+',
        location: 'City Hospital',
        status: DonationStatus.PENDING,
        donationDescription: 'Urgent blood needed'
      }

      const mockGetItem = jest.fn().mockResolvedValue(mockDonation)
      DynamoDbTableOperations.prototype.getItem = mockGetItem

      const result = await bloodDonationDynamoDbOperations.getDonationRequest(
        seekerId,
        requestPostId,
        createdAt
      )

      expect(result).toEqual(mockDonation)
      expect(mockGetItem).toHaveBeenCalledWith(
        `${BLOOD_REQUEST_PK_PREFIX}#${seekerId}`,
        `${BLOOD_REQUEST_PK_PREFIX}#${createdAt}#${requestPostId}`
      )
    })

    it('should return null when donation request does not exist', async () => {
      const seekerId = 'non-existent-seeker'
      const requestPostId = 'non-existent-request'
      const createdAt = '2024-01-01T00:00:00.000Z'

      const mockGetItem = jest.fn().mockResolvedValue(null)
      DynamoDbTableOperations.prototype.getItem = mockGetItem

      const result = await bloodDonationDynamoDbOperations.getDonationRequest(
        seekerId,
        requestPostId,
        createdAt
      )

      expect(result).toBeNull()
    })

    it('should format partition key correctly', async () => {
      const seekerId = 'test-seeker-id'
      const requestPostId = 'test-request-post-id'
      const createdAt = '2024-01-01T00:00:00.000Z'

      const mockGetItem = jest.fn().mockResolvedValue(null)
      DynamoDbTableOperations.prototype.getItem = mockGetItem

      await bloodDonationDynamoDbOperations.getDonationRequest(seekerId, requestPostId, createdAt)

      expect(mockGetItem).toHaveBeenCalledWith(
        `${BLOOD_REQUEST_PK_PREFIX}#${seekerId}`,
        expect.any(String)
      )
    })

    it('should format sort key correctly', async () => {
      const seekerId = 'test-seeker-id'
      const requestPostId = 'test-request-post-id'
      const createdAt = '2024-01-01T00:00:00.000Z'

      const mockGetItem = jest.fn().mockResolvedValue(null)
      DynamoDbTableOperations.prototype.getItem = mockGetItem

      await bloodDonationDynamoDbOperations.getDonationRequest(seekerId, requestPostId, createdAt)

      expect(mockGetItem).toHaveBeenCalledWith(
        expect.any(String),
        `${BLOOD_REQUEST_PK_PREFIX}#${createdAt}#${requestPostId}`
      )
    })

    it('should handle different donation statuses', async () => {
      const seekerId = 'test-seeker-id'
      const requestPostId = 'test-request-post-id'
      const createdAt = '2024-01-01T00:00:00.000Z'

      const statuses = [
        DonationStatus.PENDING,
        DonationStatus.ACTIVE,
        DonationStatus.COMPLETED,
        DonationStatus.CANCELLED
      ]

      const mockGetItem = jest.fn()
      DynamoDbTableOperations.prototype.getItem = mockGetItem

      for (const status of statuses) {
        const mockDonation: DonationDTO = {
          seekerId,
          requestPostId,
          createdAt,
          bloodGroup: 'A+',
          location: 'City Hospital',
          status,
          donationDescription: 'Test'
        }
        mockGetItem.mockResolvedValueOnce(mockDonation)

        const result = await bloodDonationDynamoDbOperations.getDonationRequest(
          seekerId,
          requestPostId,
          createdAt
        )

        expect(result?.status).toBe(status)
      }
    })

    it('should handle complex IDs with special characters', async () => {
      const seekerId = 'seeker-with-dashes-and-underscores_123'
      const requestPostId = 'request-post-id-with-special-chars'
      const createdAt = '2024-12-31T23:59:59.999Z'

      const mockGetItem = jest.fn().mockResolvedValue(null)
      DynamoDbTableOperations.prototype.getItem = mockGetItem

      await bloodDonationDynamoDbOperations.getDonationRequest(seekerId, requestPostId, createdAt)

      expect(mockGetItem).toHaveBeenCalledWith(
        `${BLOOD_REQUEST_PK_PREFIX}#${seekerId}`,
        `${BLOOD_REQUEST_PK_PREFIX}#${createdAt}#${requestPostId}`
      )
    })
  })

  describe('getDonationRequestsByDate', () => {
    it('should successfully get donation requests by date prefix', async () => {
      const seekerId = 'test-seeker-id'
      const datePrefix = '2024-01'

      const mockDonations: DonationDTO[] = [
        {
          seekerId,
          requestPostId: 'request-1',
          createdAt: '2024-01-01T00:00:00.000Z',
          bloodGroup: 'A+',
          location: 'Hospital A',
          status: DonationStatus.PENDING,
          donationDescription: 'Request 1'
        },
        {
          seekerId,
          requestPostId: 'request-2',
          createdAt: '2024-01-15T00:00:00.000Z',
          bloodGroup: 'B+',
          location: 'Hospital B',
          status: DonationStatus.ACTIVE,
          donationDescription: 'Request 2'
        }
      ]

      const mockModelAdapter = {
        getPrimaryIndex: jest.fn().mockReturnValue({
          partitionKey: 'PK',
          sortKey: 'SK'
        })
      }

      Object.defineProperty(bloodDonationDynamoDbOperations, 'modelAdapter', {
        value: mockModelAdapter,
        writable: true
      })

      const mockQuery = jest.fn().mockResolvedValue({ items: mockDonations })
      DynamoDbTableOperations.prototype.query = mockQuery

      const result = await bloodDonationDynamoDbOperations.getDonationRequestsByDate(
        seekerId,
        datePrefix
      )

      expect(result).toEqual(mockDonations)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          partitionKeyCondition: {
            attributeName: 'PK',
            operator: QueryConditionOperator.EQUALS,
            attributeValue: `${BLOOD_REQUEST_PK_PREFIX}#${seekerId}`
          },
          sortKeyCondition: {
            attributeName: 'SK',
            operator: QueryConditionOperator.BEGINS_WITH,
            attributeValue: `${BLOOD_REQUEST_PK_PREFIX}#${datePrefix}`
          }
        })
      )
    })

    it('should return empty array when no donations found', async () => {
      const seekerId = 'test-seeker-id'
      const datePrefix = '2024-01'

      const mockModelAdapter = {
        getPrimaryIndex: jest.fn().mockReturnValue({
          partitionKey: 'PK',
          sortKey: 'SK'
        })
      }

      Object.defineProperty(bloodDonationDynamoDbOperations, 'modelAdapter', {
        value: mockModelAdapter,
        writable: true
      })

      const mockQuery = jest.fn().mockResolvedValue({ items: [] })
      DynamoDbTableOperations.prototype.query = mockQuery

      const result = await bloodDonationDynamoDbOperations.getDonationRequestsByDate(
        seekerId,
        datePrefix
      )

      expect(result).toEqual([])
    })

    it('should handle query without sort key condition', async () => {
      const seekerId = 'test-seeker-id'
      const datePrefix = '2024-01'

      const mockModelAdapter = {
        getPrimaryIndex: jest.fn().mockReturnValue({
          partitionKey: 'PK',
          sortKey: undefined
        })
      }

      Object.defineProperty(bloodDonationDynamoDbOperations, 'modelAdapter', {
        value: mockModelAdapter,
        writable: true
      })

      const mockQuery = jest.fn().mockResolvedValue({ items: [] })
      DynamoDbTableOperations.prototype.query = mockQuery

      const result = await bloodDonationDynamoDbOperations.getDonationRequestsByDate(
        seekerId,
        datePrefix
      )

      expect(result).toEqual([])
      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          partitionKeyCondition: {
            attributeName: 'PK',
            operator: QueryConditionOperator.EQUALS,
            attributeValue: `${BLOOD_REQUEST_PK_PREFIX}#${seekerId}`
          }
        })
      )
    })

    it('should handle different date prefix formats', async () => {
      const seekerId = 'test-seeker-id'
      const datePrefixes = ['2024-01', '2024-12', '2023-06', '2025-03']

      const mockModelAdapter = {
        getPrimaryIndex: jest.fn().mockReturnValue({
          partitionKey: 'PK',
          sortKey: 'SK'
        })
      }

      Object.defineProperty(bloodDonationDynamoDbOperations, 'modelAdapter', {
        value: mockModelAdapter,
        writable: true
      })

      const mockQuery = jest.fn().mockResolvedValue({ items: [] })
      DynamoDbTableOperations.prototype.query = mockQuery

      for (const datePrefix of datePrefixes) {
        await bloodDonationDynamoDbOperations.getDonationRequestsByDate(seekerId, datePrefix)

        expect(mockQuery).toHaveBeenCalledWith(
          expect.objectContaining({
            sortKeyCondition: expect.objectContaining({
              attributeValue: `${BLOOD_REQUEST_PK_PREFIX}#${datePrefix}`
            })
          })
        )

        mockQuery.mockClear()
      }
    })

    it('should handle full date prefix (year-month-day)', async () => {
      const seekerId = 'test-seeker-id'
      const datePrefix = '2024-01-15'

      const mockModelAdapter = {
        getPrimaryIndex: jest.fn().mockReturnValue({
          partitionKey: 'PK',
          sortKey: 'SK'
        })
      }

      Object.defineProperty(bloodDonationDynamoDbOperations, 'modelAdapter', {
        value: mockModelAdapter,
        writable: true
      })

      const mockQuery = jest.fn().mockResolvedValue({ items: [] })
      DynamoDbTableOperations.prototype.query = mockQuery

      await bloodDonationDynamoDbOperations.getDonationRequestsByDate(seekerId, datePrefix)

      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          sortKeyCondition: expect.objectContaining({
            attributeValue: `${BLOOD_REQUEST_PK_PREFIX}#${datePrefix}`,
            operator: QueryConditionOperator.BEGINS_WITH
          })
        })
      )
    })

    it('should handle year-only date prefix', async () => {
      const seekerId = 'test-seeker-id'
      const datePrefix = '2024'

      const mockModelAdapter = {
        getPrimaryIndex: jest.fn().mockReturnValue({
          partitionKey: 'PK',
          sortKey: 'SK'
        })
      }

      Object.defineProperty(bloodDonationDynamoDbOperations, 'modelAdapter', {
        value: mockModelAdapter,
        writable: true
      })

      const mockQuery = jest.fn().mockResolvedValue({ items: [] })
      DynamoDbTableOperations.prototype.query = mockQuery

      await bloodDonationDynamoDbOperations.getDonationRequestsByDate(seekerId, datePrefix)

      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          sortKeyCondition: expect.objectContaining({
            attributeValue: `${BLOOD_REQUEST_PK_PREFIX}#${datePrefix}`
          })
        })
      )
    })

    it('should use EQUALS operator for partition key', async () => {
      const seekerId = 'test-seeker-id'
      const datePrefix = '2024-01'

      const mockModelAdapter = {
        getPrimaryIndex: jest.fn().mockReturnValue({
          partitionKey: 'PK',
          sortKey: 'SK'
        })
      }

      Object.defineProperty(bloodDonationDynamoDbOperations, 'modelAdapter', {
        value: mockModelAdapter,
        writable: true
      })

      const mockQuery = jest.fn().mockResolvedValue({ items: [] })
      DynamoDbTableOperations.prototype.query = mockQuery

      await bloodDonationDynamoDbOperations.getDonationRequestsByDate(seekerId, datePrefix)

      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          partitionKeyCondition: expect.objectContaining({
            operator: QueryConditionOperator.EQUALS
          })
        })
      )
    })

    it('should use BEGINS_WITH operator for sort key', async () => {
      const seekerId = 'test-seeker-id'
      const datePrefix = '2024-01'

      const mockModelAdapter = {
        getPrimaryIndex: jest.fn().mockReturnValue({
          partitionKey: 'PK',
          sortKey: 'SK'
        })
      }

      Object.defineProperty(bloodDonationDynamoDbOperations, 'modelAdapter', {
        value: mockModelAdapter,
        writable: true
      })

      const mockQuery = jest.fn().mockResolvedValue({ items: [] })
      DynamoDbTableOperations.prototype.query = mockQuery

      await bloodDonationDynamoDbOperations.getDonationRequestsByDate(seekerId, datePrefix)

      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          sortKeyCondition: expect.objectContaining({
            operator: QueryConditionOperator.BEGINS_WITH
          })
        })
      )
    })
  })
})
