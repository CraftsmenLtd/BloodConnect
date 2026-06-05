import LocationDynamoDbOperations from '../../../commons/ddbOperations/LocationDynamoDbOperations'
import DynamoDbTableOperations from '../../../commons/ddbOperations/DynamoDbTableOperations'
import type { LocationDTO } from '../../../../../../commons/dto/UserDTO'
import { QueryConditionOperator } from '../../../../../application/models/policies/repositories/QueryTypes'

jest.mock('../../../commons/ddbOperations/DynamoDbTableOperations')

describe('LocationDynamoDbOperations', () => {
  let locationDynamoDbOperations: LocationDynamoDbOperations
  const mockTableName = 'test-table'
  const mockRegion = 'us-east-1'

  beforeEach(() => {
    jest.clearAllMocks()
    locationDynamoDbOperations = new LocationDynamoDbOperations(mockTableName, mockRegion)
  })

  describe('constructor', () => {
    it('should initialize with correct table name and region', () => {
      expect(locationDynamoDbOperations).toBeInstanceOf(LocationDynamoDbOperations)
      expect(locationDynamoDbOperations).toBeInstanceOf(DynamoDbTableOperations)
    })
  })

  describe('queryUserLocations', () => {
    it('should successfully query user locations', async () => {
      const userId = 'test-user-id'
      const mockLocations: LocationDTO[] = [
        {
          locationId: 'location-1',
          userId,
          address: 'City Hospital, Dhaka',
          geohash: 'abc123',
          lat: 23.8103,
          lng: 90.4125
        },
        {
          locationId: 'location-2',
          userId,
          address: 'General Hospital, Dhaka',
          geohash: 'abc124',
          lat: 23.8104,
          lng: 90.4126
        }
      ]

      const mockModelAdapter = {
        getPrimaryIndex: jest.fn().mockReturnValue({
          partitionKey: 'PK',
          sortKey: 'SK'
        })
      }

      Object.defineProperty(locationDynamoDbOperations, 'modelAdapter', {
        value: mockModelAdapter,
        writable: true
      })

      const mockQuery = jest.fn().mockResolvedValue({ items: mockLocations })
      DynamoDbTableOperations.prototype.query = mockQuery

      const result = await locationDynamoDbOperations.queryUserLocations(userId)

      expect(result).toEqual(mockLocations)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          partitionKeyCondition: {
            attributeName: 'PK',
            operator: QueryConditionOperator.EQUALS,
            attributeValue: `USER#${userId}`
          },
          sortKeyCondition: {
            attributeName: 'SK',
            operator: QueryConditionOperator.BEGINS_WITH,
            attributeValue: 'LOCATION#'
          }
        })
      )
    })

    it('should return empty array when no locations found', async () => {
      const userId = 'test-user-id'

      const mockModelAdapter = {
        getPrimaryIndex: jest.fn().mockReturnValue({
          partitionKey: 'PK',
          sortKey: 'SK'
        })
      }

      Object.defineProperty(locationDynamoDbOperations, 'modelAdapter', {
        value: mockModelAdapter,
        writable: true
      })

      const mockQuery = jest.fn().mockResolvedValue({ items: [] })
      DynamoDbTableOperations.prototype.query = mockQuery

      const result = await locationDynamoDbOperations.queryUserLocations(userId)

      expect(result).toEqual([])
    })

    it('should format partition key correctly with USER prefix', async () => {
      const userId = 'test-user-id'

      const mockModelAdapter = {
        getPrimaryIndex: jest.fn().mockReturnValue({
          partitionKey: 'PK',
          sortKey: 'SK'
        })
      }

      Object.defineProperty(locationDynamoDbOperations, 'modelAdapter', {
        value: mockModelAdapter,
        writable: true
      })

      const mockQuery = jest.fn().mockResolvedValue({ items: [] })
      DynamoDbTableOperations.prototype.query = mockQuery

      await locationDynamoDbOperations.queryUserLocations(userId)

      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          partitionKeyCondition: expect.objectContaining({
            attributeValue: `USER#${userId}`
          })
        })
      )
    })

    it('should handle query without sort key', async () => {
      const userId = 'test-user-id'

      const mockModelAdapter = {
        getPrimaryIndex: jest.fn().mockReturnValue({
          partitionKey: 'PK',
          sortKey: undefined
        })
      }

      Object.defineProperty(locationDynamoDbOperations, 'modelAdapter', {
        value: mockModelAdapter,
        writable: true
      })

      const mockQuery = jest.fn().mockResolvedValue({ items: [] })
      DynamoDbTableOperations.prototype.query = mockQuery

      const result = await locationDynamoDbOperations.queryUserLocations(userId)

      expect(result).toEqual([])
      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          partitionKeyCondition: {
            attributeName: 'PK',
            operator: QueryConditionOperator.EQUALS,
            attributeValue: `USER#${userId}`
          }
        })
      )
    })

    it('should use BEGINS_WITH operator for LOCATION# prefix', async () => {
      const userId = 'test-user-id'

      const mockModelAdapter = {
        getPrimaryIndex: jest.fn().mockReturnValue({
          partitionKey: 'PK',
          sortKey: 'SK'
        })
      }

      Object.defineProperty(locationDynamoDbOperations, 'modelAdapter', {
        value: mockModelAdapter,
        writable: true
      })

      const mockQuery = jest.fn().mockResolvedValue({ items: [] })
      DynamoDbTableOperations.prototype.query = mockQuery

      await locationDynamoDbOperations.queryUserLocations(userId)

      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          sortKeyCondition: expect.objectContaining({
            operator: QueryConditionOperator.BEGINS_WITH,
            attributeValue: 'LOCATION#'
          })
        })
      )
    })
  })

  describe('deleteUserLocations', () => {
    it('should successfully delete all user locations', async () => {
      const userId = 'test-user-id'
      const mockLocations: LocationDTO[] = [
        {
          locationId: 'location-1',
          userId,
          address: 'City Hospital',
          geohash: 'abc123',
          lat: 23.8103,
          lng: 90.4125
        },
        {
          locationId: 'location-2',
          userId,
          address: 'General Hospital',
          geohash: 'abc124',
          lat: 23.8104,
          lng: 90.4126
        }
      ]

      const mockModelAdapter = {
        getPrimaryIndex: jest.fn().mockReturnValue({
          partitionKey: 'PK',
          sortKey: 'SK'
        })
      }

      Object.defineProperty(locationDynamoDbOperations, 'modelAdapter', {
        value: mockModelAdapter,
        writable: true
      })

      const mockQuery = jest.fn().mockResolvedValue({ items: mockLocations })
      const mockDelete = jest.fn().mockResolvedValue(undefined)
      DynamoDbTableOperations.prototype.query = mockQuery
      DynamoDbTableOperations.prototype.delete = mockDelete

      await locationDynamoDbOperations.deleteUserLocations(userId)

      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          partitionKeyCondition: {
            attributeName: 'PK',
            operator: QueryConditionOperator.EQUALS,
            attributeValue: `USER#${userId}`
          },
          sortKeyCondition: {
            attributeName: 'SK',
            operator: QueryConditionOperator.BEGINS_WITH,
            attributeValue: 'LOCATION#'
          }
        })
      )
      expect(mockDelete).toHaveBeenCalledTimes(2)
      expect(mockDelete).toHaveBeenNthCalledWith(1, `USER#${userId}`, 'LOCATION#location-1')
      expect(mockDelete).toHaveBeenNthCalledWith(2, `USER#${userId}`, 'LOCATION#location-2')
    })

    it('should handle deletion when no locations exist', async () => {
      const userId = 'test-user-id'

      const mockModelAdapter = {
        getPrimaryIndex: jest.fn().mockReturnValue({
          partitionKey: 'PK',
          sortKey: 'SK'
        })
      }

      Object.defineProperty(locationDynamoDbOperations, 'modelAdapter', {
        value: mockModelAdapter,
        writable: true
      })

      const mockQuery = jest.fn().mockResolvedValue({ items: [] })
      const mockDelete = jest.fn()
      DynamoDbTableOperations.prototype.query = mockQuery
      DynamoDbTableOperations.prototype.delete = mockDelete

      await locationDynamoDbOperations.deleteUserLocations(userId)

      expect(mockDelete).not.toHaveBeenCalled()
    })

    it('should delete single location', async () => {
      const userId = 'test-user-id'
      const mockLocation: LocationDTO[] = [
        {
          locationId: 'location-1',
          userId,
          address: 'City Hospital',
          geohash: 'abc123',
          lat: 23.8103,
          lng: 90.4125
        }
      ]

      const mockModelAdapter = {
        getPrimaryIndex: jest.fn().mockReturnValue({
          partitionKey: 'PK',
          sortKey: 'SK'
        })
      }

      Object.defineProperty(locationDynamoDbOperations, 'modelAdapter', {
        value: mockModelAdapter,
        writable: true
      })

      const mockQuery = jest.fn().mockResolvedValue({ items: mockLocation })
      const mockDelete = jest.fn().mockResolvedValue(undefined)
      DynamoDbTableOperations.prototype.query = mockQuery
      DynamoDbTableOperations.prototype.delete = mockDelete

      await locationDynamoDbOperations.deleteUserLocations(userId)

      expect(mockDelete).toHaveBeenCalledTimes(1)
      expect(mockDelete).toHaveBeenCalledWith(`USER#${userId}`, 'LOCATION#location-1')
    })

    it('should delete multiple locations sequentially', async () => {
      const userId = 'test-user-id'
      const mockLocations: LocationDTO[] = [
        {
          locationId: 'location-1',
          userId,
          address: 'Hospital 1',
          geohash: 'abc123',
          lat: 23.8103,
          lng: 90.4125
        },
        {
          locationId: 'location-2',
          userId,
          address: 'Hospital 2',
          geohash: 'abc124',
          lat: 23.8104,
          lng: 90.4126
        },
        {
          locationId: 'location-3',
          userId,
          address: 'Hospital 3',
          geohash: 'abc125',
          lat: 23.8105,
          lng: 90.4127
        }
      ]

      const mockModelAdapter = {
        getPrimaryIndex: jest.fn().mockReturnValue({
          partitionKey: 'PK',
          sortKey: 'SK'
        })
      }

      Object.defineProperty(locationDynamoDbOperations, 'modelAdapter', {
        value: mockModelAdapter,
        writable: true
      })

      const mockQuery = jest.fn().mockResolvedValue({ items: mockLocations })
      const mockDelete = jest.fn().mockResolvedValue(undefined)
      DynamoDbTableOperations.prototype.query = mockQuery
      DynamoDbTableOperations.prototype.delete = mockDelete

      await locationDynamoDbOperations.deleteUserLocations(userId)

      expect(mockDelete).toHaveBeenCalledTimes(3)
    })

    it('should handle query without sort key during deletion', async () => {
      const userId = 'test-user-id'

      const mockModelAdapter = {
        getPrimaryIndex: jest.fn().mockReturnValue({
          partitionKey: 'PK',
          sortKey: undefined
        })
      }

      Object.defineProperty(locationDynamoDbOperations, 'modelAdapter', {
        value: mockModelAdapter,
        writable: true
      })

      const mockQuery = jest.fn().mockResolvedValue({ items: [] })
      const mockDelete = jest.fn()
      DynamoDbTableOperations.prototype.query = mockQuery
      DynamoDbTableOperations.prototype.delete = mockDelete

      await locationDynamoDbOperations.deleteUserLocations(userId)

      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          partitionKeyCondition: {
            attributeName: 'PK',
            operator: QueryConditionOperator.EQUALS,
            attributeValue: `USER#${userId}`
          }
        })
      )
      expect(mockDelete).not.toHaveBeenCalled()
    })

    it('should handle deletion errors gracefully', async () => {
      const userId = 'test-user-id'
      const mockLocation: LocationDTO[] = [
        {
          locationId: 'location-1',
          userId,
          address: 'City Hospital',
          geohash: 'abc123',
          lat: 23.8103,
          lng: 90.4125
        }
      ]

      const mockModelAdapter = {
        getPrimaryIndex: jest.fn().mockReturnValue({
          partitionKey: 'PK',
          sortKey: 'SK'
        })
      }

      Object.defineProperty(locationDynamoDbOperations, 'modelAdapter', {
        value: mockModelAdapter,
        writable: true
      })

      const mockQuery = jest.fn().mockResolvedValue({ items: mockLocation })
      const mockDelete = jest.fn().mockRejectedValue(new Error('Delete failed'))
      DynamoDbTableOperations.prototype.query = mockQuery
      DynamoDbTableOperations.prototype.delete = mockDelete

      await expect(locationDynamoDbOperations.deleteUserLocations(userId)).rejects.toThrow(
        'Delete failed'
      )
    })

    it('should format delete keys correctly', async () => {
      const userId = 'test-user-id'
      const mockLocation: LocationDTO[] = [
        {
          locationId: 'my-location-123',
          userId,
          address: 'Test Address',
          geohash: 'abc123',
          lat: 23.8103,
          lng: 90.4125
        }
      ]

      const mockModelAdapter = {
        getPrimaryIndex: jest.fn().mockReturnValue({
          partitionKey: 'PK',
          sortKey: 'SK'
        })
      }

      Object.defineProperty(locationDynamoDbOperations, 'modelAdapter', {
        value: mockModelAdapter,
        writable: true
      })

      const mockQuery = jest.fn().mockResolvedValue({ items: mockLocation })
      const mockDelete = jest.fn().mockResolvedValue(undefined)
      DynamoDbTableOperations.prototype.query = mockQuery
      DynamoDbTableOperations.prototype.delete = mockDelete

      await locationDynamoDbOperations.deleteUserLocations(userId)

      expect(mockDelete).toHaveBeenCalledWith(`USER#${userId}`, 'LOCATION#my-location-123')
    })
  })
})
