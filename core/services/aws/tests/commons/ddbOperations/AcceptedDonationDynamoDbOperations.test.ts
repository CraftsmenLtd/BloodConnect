import AcceptedDonationDynamoDbOperations from '../../../commons/ddbOperations/AcceptedDonationDynamoDbOperations'
import DynamoDbTableOperations from '../../../commons/ddbOperations/DynamoDbTableOperations'
import type { AcceptDonationDTO } from '../../../../../../commons/dto/DonationDTO'
import { AcceptDonationStatus } from '../../../../../../commons/dto/DonationDTO'
import { QueryConditionOperator } from '../../../../../application/models/policies/repositories/QueryTypes'
import {
  ACCEPTED_DONATION_PK_PREFIX,
  ACCEPTED_DONATION_SK_PREFIX
} from '../../../commons/ddbModels/AcceptDonationModel'

jest.mock('../../../commons/ddbOperations/DynamoDbTableOperations')

describe('AcceptedDonationDynamoDbOperations', () => {
  let acceptedDonationDynamoDbOperations: AcceptedDonationDynamoDbOperations
  const mockTableName = 'test-accepted-donation-table'
  const mockRegion = 'us-east-1'

  beforeEach(() => {
    jest.clearAllMocks()
    acceptedDonationDynamoDbOperations = new AcceptedDonationDynamoDbOperations(
      mockTableName,
      mockRegion
    )
  })

  describe('constructor', () => {
    it('should initialize with correct table name and region', () => {
      expect(acceptedDonationDynamoDbOperations).toBeInstanceOf(
        AcceptedDonationDynamoDbOperations
      )
      expect(acceptedDonationDynamoDbOperations).toBeInstanceOf(DynamoDbTableOperations)
    })

    it('should initialize with AcceptDonationRequestModel adapter', () => {
      const newInstance = new AcceptedDonationDynamoDbOperations(mockTableName, mockRegion)
      expect(newInstance).toBeDefined()
    })
  })

  describe('getAcceptedRequest', () => {
    const seekerId = 'seeker-123'
    const requestPostId = 'request-456'
    const donorId = 'donor-789'

    it('should successfully get an accepted request', async () => {
      const mockAcceptedDonation: AcceptDonationDTO = {
        id: 'accept-1',
        seekerId,
        requestPostId,
        donorId,
        acceptanceTime: '2024-01-15T10:00:00.000Z',
        status: AcceptDonationStatus.ACCEPTED,
        createdAt: '2024-01-15T09:00:00.000Z'
      }

      const mockGetItem = jest.fn().mockResolvedValue(mockAcceptedDonation)
      DynamoDbTableOperations.prototype.getItem = mockGetItem

      const result = await acceptedDonationDynamoDbOperations.getAcceptedRequest(
        seekerId,
        requestPostId,
        donorId
      )

      expect(result).toEqual(mockAcceptedDonation)
      expect(mockGetItem).toHaveBeenCalledWith(
        `${ACCEPTED_DONATION_PK_PREFIX}#${seekerId}`,
        `${ACCEPTED_DONATION_SK_PREFIX}#${requestPostId}#${donorId}`
      )
      expect(mockGetItem).toHaveBeenCalledTimes(1)
    })

    it('should return null when accepted request does not exist', async () => {
      const mockGetItem = jest.fn().mockResolvedValue(null)
      DynamoDbTableOperations.prototype.getItem = mockGetItem

      const result = await acceptedDonationDynamoDbOperations.getAcceptedRequest(
        seekerId,
        requestPostId,
        donorId
      )

      expect(result).toBeNull()
      expect(mockGetItem).toHaveBeenCalledWith(
        `${ACCEPTED_DONATION_PK_PREFIX}#${seekerId}`,
        `${ACCEPTED_DONATION_SK_PREFIX}#${requestPostId}#${donorId}`
      )
    })

    it('should format partition key correctly with seeker ID', async () => {
      const mockGetItem = jest.fn().mockResolvedValue(null)
      DynamoDbTableOperations.prototype.getItem = mockGetItem

      await acceptedDonationDynamoDbOperations.getAcceptedRequest(
        'test-seeker-id',
        requestPostId,
        donorId
      )

      expect(mockGetItem).toHaveBeenCalledWith(
        `${ACCEPTED_DONATION_PK_PREFIX}#test-seeker-id`,
        expect.any(String)
      )
    })

    it('should format sort key correctly with request post ID and donor ID', async () => {
      const mockGetItem = jest.fn().mockResolvedValue(null)
      DynamoDbTableOperations.prototype.getItem = mockGetItem

      await acceptedDonationDynamoDbOperations.getAcceptedRequest(
        seekerId,
        'post-123',
        'donor-456'
      )

      expect(mockGetItem).toHaveBeenCalledWith(
        expect.any(String),
        `${ACCEPTED_DONATION_SK_PREFIX}#post-123#donor-456`
      )
    })

    it('should handle accepted request with PENDING status', async () => {
      const mockAcceptedDonation: AcceptDonationDTO = {
        id: 'accept-2',
        seekerId,
        requestPostId,
        donorId,
        status: AcceptDonationStatus.PENDING,
        createdAt: '2024-01-15T09:00:00.000Z'
      }

      const mockGetItem = jest.fn().mockResolvedValue(mockAcceptedDonation)
      DynamoDbTableOperations.prototype.getItem = mockGetItem

      const result = await acceptedDonationDynamoDbOperations.getAcceptedRequest(
        seekerId,
        requestPostId,
        donorId
      )

      expect(result?.status).toBe(AcceptDonationStatus.PENDING)
    })

    it('should handle accepted request with COMPLETED status', async () => {
      const mockAcceptedDonation: AcceptDonationDTO = {
        id: 'accept-3',
        seekerId,
        requestPostId,
        donorId,
        acceptanceTime: '2024-01-15T10:00:00.000Z',
        status: AcceptDonationStatus.COMPLETED,
        createdAt: '2024-01-15T09:00:00.000Z'
      }

      const mockGetItem = jest.fn().mockResolvedValue(mockAcceptedDonation)
      DynamoDbTableOperations.prototype.getItem = mockGetItem

      const result = await acceptedDonationDynamoDbOperations.getAcceptedRequest(
        seekerId,
        requestPostId,
        donorId
      )

      expect(result?.status).toBe(AcceptDonationStatus.COMPLETED)
    })

    it('should handle accepted request with IGNORED status', async () => {
      const mockAcceptedDonation: AcceptDonationDTO = {
        id: 'accept-4',
        seekerId,
        requestPostId,
        donorId,
        status: AcceptDonationStatus.IGNORED,
        createdAt: '2024-01-15T09:00:00.000Z'
      }

      const mockGetItem = jest.fn().mockResolvedValue(mockAcceptedDonation)
      DynamoDbTableOperations.prototype.getItem = mockGetItem

      const result = await acceptedDonationDynamoDbOperations.getAcceptedRequest(
        seekerId,
        requestPostId,
        donorId
      )

      expect(result?.status).toBe(AcceptDonationStatus.IGNORED)
    })

    it('should handle accepted request with optional acceptanceTime', async () => {
      const mockAcceptedDonation: AcceptDonationDTO = {
        id: 'accept-5',
        seekerId,
        requestPostId,
        donorId,
        acceptanceTime: '2024-01-15T10:30:00.000Z',
        status: AcceptDonationStatus.ACCEPTED,
        createdAt: '2024-01-15T09:00:00.000Z'
      }

      const mockGetItem = jest.fn().mockResolvedValue(mockAcceptedDonation)
      DynamoDbTableOperations.prototype.getItem = mockGetItem

      const result = await acceptedDonationDynamoDbOperations.getAcceptedRequest(
        seekerId,
        requestPostId,
        donorId
      )

      expect(result?.acceptanceTime).toBe('2024-01-15T10:30:00.000Z')
    })
  })

  describe('queryAcceptedRequests', () => {
    const seekerId = 'seeker-123'
    const requestPostId = 'request-456'

    it('should successfully query accepted requests', async () => {
      const mockAcceptedDonations: AcceptDonationDTO[] = [
        {
          id: 'accept-1',
          seekerId,
          requestPostId,
          donorId: 'donor-1',
          acceptanceTime: '2024-01-15T10:00:00.000Z',
          status: AcceptDonationStatus.ACCEPTED,
          createdAt: '2024-01-15T09:00:00.000Z'
        },
        {
          id: 'accept-2',
          seekerId,
          requestPostId,
          donorId: 'donor-2',
          acceptanceTime: '2024-01-15T11:00:00.000Z',
          status: AcceptDonationStatus.ACCEPTED,
          createdAt: '2024-01-15T09:00:00.000Z'
        }
      ]

      const mockModelAdapter = {
        getPrimaryIndex: jest.fn().mockReturnValue({
          partitionKey: 'PK',
          sortKey: 'SK'
        })
      }

      Object.defineProperty(acceptedDonationDynamoDbOperations, 'modelAdapter', {
        value: mockModelAdapter,
        writable: true
      })

      const mockQuery = jest.fn().mockResolvedValue({ items: mockAcceptedDonations })
      DynamoDbTableOperations.prototype.query = mockQuery

      const result = await acceptedDonationDynamoDbOperations.queryAcceptedRequests(
        seekerId,
        requestPostId
      )

      expect(result).toEqual(mockAcceptedDonations)
      expect(mockModelAdapter.getPrimaryIndex).toHaveBeenCalled()
      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          partitionKeyCondition: {
            attributeName: 'PK',
            operator: QueryConditionOperator.EQUALS,
            attributeValue: `${ACCEPTED_DONATION_PK_PREFIX}#${seekerId}`
          },
          sortKeyCondition: {
            attributeName: 'SK',
            operator: QueryConditionOperator.BEGINS_WITH,
            attributeValue: `${ACCEPTED_DONATION_SK_PREFIX}#${requestPostId}`
          }
        })
      )
    })

    it('should return empty array when no accepted requests found', async () => {
      const mockModelAdapter = {
        getPrimaryIndex: jest.fn().mockReturnValue({
          partitionKey: 'PK',
          sortKey: 'SK'
        })
      }

      Object.defineProperty(acceptedDonationDynamoDbOperations, 'modelAdapter', {
        value: mockModelAdapter,
        writable: true
      })

      const mockQuery = jest.fn().mockResolvedValue({ items: [] })
      DynamoDbTableOperations.prototype.query = mockQuery

      const result = await acceptedDonationDynamoDbOperations.queryAcceptedRequests(
        seekerId,
        requestPostId
      )

      expect(result).toEqual([])
    })

    it('should format partition key correctly with seeker ID', async () => {
      const mockModelAdapter = {
        getPrimaryIndex: jest.fn().mockReturnValue({
          partitionKey: 'PK',
          sortKey: 'SK'
        })
      }

      Object.defineProperty(acceptedDonationDynamoDbOperations, 'modelAdapter', {
        value: mockModelAdapter,
        writable: true
      })

      const mockQuery = jest.fn().mockResolvedValue({ items: [] })
      DynamoDbTableOperations.prototype.query = mockQuery

      await acceptedDonationDynamoDbOperations.queryAcceptedRequests(
        'custom-seeker-id',
        requestPostId
      )

      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          partitionKeyCondition: expect.objectContaining({
            attributeValue: `${ACCEPTED_DONATION_PK_PREFIX}#custom-seeker-id`
          })
        })
      )
    })

    it('should use BEGINS_WITH operator for sort key', async () => {
      const mockModelAdapter = {
        getPrimaryIndex: jest.fn().mockReturnValue({
          partitionKey: 'PK',
          sortKey: 'SK'
        })
      }

      Object.defineProperty(acceptedDonationDynamoDbOperations, 'modelAdapter', {
        value: mockModelAdapter,
        writable: true
      })

      const mockQuery = jest.fn().mockResolvedValue({ items: [] })
      DynamoDbTableOperations.prototype.query = mockQuery

      await acceptedDonationDynamoDbOperations.queryAcceptedRequests(seekerId, requestPostId)

      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          sortKeyCondition: expect.objectContaining({
            operator: QueryConditionOperator.BEGINS_WITH
          })
        })
      )
    })

    it('should query without sort key condition if sort key is undefined', async () => {
      const mockModelAdapter = {
        getPrimaryIndex: jest.fn().mockReturnValue({
          partitionKey: 'PK',
          sortKey: undefined
        })
      }

      Object.defineProperty(acceptedDonationDynamoDbOperations, 'modelAdapter', {
        value: mockModelAdapter,
        writable: true
      })

      const mockQuery = jest.fn().mockResolvedValue({ items: [] })
      DynamoDbTableOperations.prototype.query = mockQuery

      await acceptedDonationDynamoDbOperations.queryAcceptedRequests(seekerId, requestPostId)

      const callArgs = mockQuery.mock.calls[0][0]
      expect(callArgs.sortKeyCondition).toBeUndefined()
      expect(callArgs.partitionKeyCondition).toBeDefined()
    })

    it('should handle multiple accepted requests with different statuses', async () => {
      const mockAcceptedDonations: AcceptDonationDTO[] = [
        {
          id: 'accept-1',
          seekerId,
          requestPostId,
          donorId: 'donor-1',
          status: AcceptDonationStatus.PENDING,
          createdAt: '2024-01-15T09:00:00.000Z'
        },
        {
          id: 'accept-2',
          seekerId,
          requestPostId,
          donorId: 'donor-2',
          acceptanceTime: '2024-01-15T10:00:00.000Z',
          status: AcceptDonationStatus.ACCEPTED,
          createdAt: '2024-01-15T09:00:00.000Z'
        },
        {
          id: 'accept-3',
          seekerId,
          requestPostId,
          donorId: 'donor-3',
          status: AcceptDonationStatus.IGNORED,
          createdAt: '2024-01-15T09:00:00.000Z'
        }
      ]

      const mockModelAdapter = {
        getPrimaryIndex: jest.fn().mockReturnValue({
          partitionKey: 'PK',
          sortKey: 'SK'
        })
      }

      Object.defineProperty(acceptedDonationDynamoDbOperations, 'modelAdapter', {
        value: mockModelAdapter,
        writable: true
      })

      const mockQuery = jest.fn().mockResolvedValue({ items: mockAcceptedDonations })
      DynamoDbTableOperations.prototype.query = mockQuery

      const result = await acceptedDonationDynamoDbOperations.queryAcceptedRequests(
        seekerId,
        requestPostId
      )

      expect(result).toHaveLength(3)
      expect(result?.[0].status).toBe(AcceptDonationStatus.PENDING)
      expect(result?.[1].status).toBe(AcceptDonationStatus.ACCEPTED)
      expect(result?.[2].status).toBe(AcceptDonationStatus.IGNORED)
    })

    it('should handle query for single accepted request', async () => {
      const mockAcceptedDonation: AcceptDonationDTO[] = [
        {
          id: 'accept-1',
          seekerId,
          requestPostId,
          donorId: 'donor-1',
          acceptanceTime: '2024-01-15T10:00:00.000Z',
          status: AcceptDonationStatus.ACCEPTED,
          createdAt: '2024-01-15T09:00:00.000Z'
        }
      ]

      const mockModelAdapter = {
        getPrimaryIndex: jest.fn().mockReturnValue({
          partitionKey: 'PK',
          sortKey: 'SK'
        })
      }

      Object.defineProperty(acceptedDonationDynamoDbOperations, 'modelAdapter', {
        value: mockModelAdapter,
        writable: true
      })

      const mockQuery = jest.fn().mockResolvedValue({ items: mockAcceptedDonation })
      DynamoDbTableOperations.prototype.query = mockQuery

      const result = await acceptedDonationDynamoDbOperations.queryAcceptedRequests(
        seekerId,
        requestPostId
      )

      expect(result).toHaveLength(1)
      expect(result?.[0]).toEqual(mockAcceptedDonation[0])
    })

    it('should use EQUALS operator for partition key', async () => {
      const mockModelAdapter = {
        getPrimaryIndex: jest.fn().mockReturnValue({
          partitionKey: 'PK',
          sortKey: 'SK'
        })
      }

      Object.defineProperty(acceptedDonationDynamoDbOperations, 'modelAdapter', {
        value: mockModelAdapter,
        writable: true
      })

      const mockQuery = jest.fn().mockResolvedValue({ items: [] })
      DynamoDbTableOperations.prototype.query = mockQuery

      await acceptedDonationDynamoDbOperations.queryAcceptedRequests(seekerId, requestPostId)

      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          partitionKeyCondition: expect.objectContaining({
            operator: QueryConditionOperator.EQUALS
          })
        })
      )
    })

    it('should format sort key value with request post ID prefix', async () => {
      const mockModelAdapter = {
        getPrimaryIndex: jest.fn().mockReturnValue({
          partitionKey: 'PK',
          sortKey: 'SK'
        })
      }

      Object.defineProperty(acceptedDonationDynamoDbOperations, 'modelAdapter', {
        value: mockModelAdapter,
        writable: true
      })

      const mockQuery = jest.fn().mockResolvedValue({ items: [] })
      DynamoDbTableOperations.prototype.query = mockQuery

      await acceptedDonationDynamoDbOperations.queryAcceptedRequests(
        seekerId,
        'custom-post-id'
      )

      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          sortKeyCondition: expect.objectContaining({
            attributeValue: `${ACCEPTED_DONATION_SK_PREFIX}#custom-post-id`
          })
        })
      )
    })
  })

  describe('deleteAcceptedRequest', () => {
    const seekerId = 'seeker-123'
    const requestPostId = 'request-456'
    const donorId = 'donor-789'

    it('should successfully delete an accepted request', async () => {
      const mockDelete = jest.fn().mockResolvedValue(undefined)
      DynamoDbTableOperations.prototype.delete = mockDelete

      await acceptedDonationDynamoDbOperations.deleteAcceptedRequest(
        seekerId,
        requestPostId,
        donorId
      )

      expect(mockDelete).toHaveBeenCalledWith(
        `${ACCEPTED_DONATION_PK_PREFIX}#${seekerId}`,
        `${ACCEPTED_DONATION_SK_PREFIX}#${requestPostId}#${donorId}`
      )
      expect(mockDelete).toHaveBeenCalledTimes(1)
    })

    it('should format partition key correctly for deletion', async () => {
      const mockDelete = jest.fn().mockResolvedValue(undefined)
      DynamoDbTableOperations.prototype.delete = mockDelete

      await acceptedDonationDynamoDbOperations.deleteAcceptedRequest(
        'test-seeker',
        requestPostId,
        donorId
      )

      expect(mockDelete).toHaveBeenCalledWith(
        `${ACCEPTED_DONATION_PK_PREFIX}#test-seeker`,
        expect.any(String)
      )
    })

    it('should format sort key correctly for deletion', async () => {
      const mockDelete = jest.fn().mockResolvedValue(undefined)
      DynamoDbTableOperations.prototype.delete = mockDelete

      await acceptedDonationDynamoDbOperations.deleteAcceptedRequest(
        seekerId,
        'post-123',
        'donor-456'
      )

      expect(mockDelete).toHaveBeenCalledWith(
        expect.any(String),
        `${ACCEPTED_DONATION_SK_PREFIX}#post-123#donor-456`
      )
    })

    it('should handle deletion errors', async () => {
      const mockDelete = jest.fn().mockRejectedValue(new Error('Delete failed'))
      DynamoDbTableOperations.prototype.delete = mockDelete

      await expect(
        acceptedDonationDynamoDbOperations.deleteAcceptedRequest(
          seekerId,
          requestPostId,
          donorId
        )
      ).rejects.toThrow('Delete failed')

      expect(mockDelete).toHaveBeenCalledTimes(1)
    })

    it('should return void on successful deletion', async () => {
      const mockDelete = jest.fn().mockResolvedValue(undefined)
      DynamoDbTableOperations.prototype.delete = mockDelete

      const result = await acceptedDonationDynamoDbOperations.deleteAcceptedRequest(
        seekerId,
        requestPostId,
        donorId
      )

      expect(result).toBeUndefined()
    })

    it('should delete with different seeker IDs', async () => {
      const mockDelete = jest.fn().mockResolvedValue(undefined)
      DynamoDbTableOperations.prototype.delete = mockDelete

      const seekerIds = ['seeker-1', 'seeker-2', 'seeker-3']

      for (const id of seekerIds) {
        mockDelete.mockClear()

        await acceptedDonationDynamoDbOperations.deleteAcceptedRequest(
          id,
          requestPostId,
          donorId
        )

        expect(mockDelete).toHaveBeenCalledWith(
          `${ACCEPTED_DONATION_PK_PREFIX}#${id}`,
          expect.any(String)
        )
      }
    })

    it('should delete with different donor IDs', async () => {
      const mockDelete = jest.fn().mockResolvedValue(undefined)
      DynamoDbTableOperations.prototype.delete = mockDelete

      const donorIds = ['donor-1', 'donor-2', 'donor-3']

      for (const id of donorIds) {
        mockDelete.mockClear()

        await acceptedDonationDynamoDbOperations.deleteAcceptedRequest(
          seekerId,
          requestPostId,
          id
        )

        expect(mockDelete).toHaveBeenCalledWith(
          expect.any(String),
          `${ACCEPTED_DONATION_SK_PREFIX}#${requestPostId}#${id}`
        )
      }
    })

    it('should delete with different request post IDs', async () => {
      const mockDelete = jest.fn().mockResolvedValue(undefined)
      DynamoDbTableOperations.prototype.delete = mockDelete

      const postIds = ['post-1', 'post-2', 'post-3']

      for (const id of postIds) {
        mockDelete.mockClear()

        await acceptedDonationDynamoDbOperations.deleteAcceptedRequest(
          seekerId,
          id,
          donorId
        )

        expect(mockDelete).toHaveBeenCalledWith(
          expect.any(String),
          `${ACCEPTED_DONATION_SK_PREFIX}#${id}#${donorId}`
        )
      }
    })
  })

  describe('key prefix constants', () => {
    it('should use BLOOD_REQ as partition key prefix', () => {
      expect(ACCEPTED_DONATION_PK_PREFIX).toBe('BLOOD_REQ')
    })

    it('should use ACCEPTED as sort key prefix', () => {
      expect(ACCEPTED_DONATION_SK_PREFIX).toBe('ACCEPTED')
    })
  })
})
