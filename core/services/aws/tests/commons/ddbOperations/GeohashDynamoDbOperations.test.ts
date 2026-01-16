import GeohashDynamoDbOperations from '../../../commons/ddbOperations/GeohashDynamoDbOperations'
import DynamoDbTableOperations from '../../../commons/ddbOperations/DynamoDbTableOperations'
import type { LocationDTO } from '../../../../../../commons/dto/UserDTO'
import { QueryConditionOperator } from '../../../../../application/models/policies/repositories/QueryTypes'

jest.mock('../../../commons/ddbOperations/DynamoDbTableOperations')

describe('GeohashDynamoDbOperations', () => {
  let geohashDynamoDbOperations: GeohashDynamoDbOperations
  const mockTableName = 'test-geohash-table'
  const mockRegion = 'us-east-1'

  beforeEach(() => {
    jest.clearAllMocks()
    geohashDynamoDbOperations = new GeohashDynamoDbOperations(mockTableName, mockRegion)
  })

  describe('constructor', () => {
    it('should initialize with correct table name and region', () => {
      expect(geohashDynamoDbOperations).toBeInstanceOf(GeohashDynamoDbOperations)
      expect(geohashDynamoDbOperations).toBeInstanceOf(DynamoDbTableOperations)
    })

    it('should initialize with LocationModel adapter', () => {
      const newInstance = new GeohashDynamoDbOperations(mockTableName, mockRegion)
      expect(newInstance).toBeDefined()
    })
  })

  describe('queryGeohash', () => {
    const countryCode = 'BD'
    const geoPartition = 'w3g'
    const requestedBloodGroup = 'A+'
    const geohash = 'w3gw2v'

    it('should successfully query geohash with all parameters', async () => {
      const mockLocations: LocationDTO[] = [
        {
          userId: 'user-1',
          locationId: 'location-1',
          area: 'Mirpur, Dhaka',
          countryCode: 'BD',
          latitude: 23.8103,
          longitude: 90.4125,
          geohash: 'w3gw2v3k',
          createdAt: '2024-01-01T00:00:00.000Z',
          bloodGroup: 'A+',
          availableForDonation: true,
          lastVaccinatedDate: '2023-12-01'
        },
        {
          userId: 'user-2',
          locationId: 'location-2',
          area: 'Mirpur, Dhaka',
          countryCode: 'BD',
          latitude: 23.8104,
          longitude: 90.4126,
          geohash: 'w3gw2v4k',
          createdAt: '2024-01-02T00:00:00.000Z',
          bloodGroup: 'A+',
          availableForDonation: true,
          lastVaccinatedDate: '2023-12-01'
        }
      ]

      const mockModelAdapter = {
        getIndex: jest.fn().mockReturnValue({
          partitionKey: 'GSI1PK',
          sortKey: 'GSI1SK'
        })
      }

      Object.defineProperty(geohashDynamoDbOperations, 'modelAdapter', {
        value: mockModelAdapter,
        writable: true
      })

      const mockQuery = jest.fn().mockResolvedValue({
        items: mockLocations,
        lastEvaluatedKey: undefined
      })
      DynamoDbTableOperations.prototype.query = mockQuery

      const result = await geohashDynamoDbOperations.queryGeohash(
        countryCode,
        geoPartition,
        requestedBloodGroup,
        geohash,
        undefined
      )

      expect(result.items).toEqual(mockLocations)
      expect(result.lastEvaluatedKey).toBeUndefined()
      expect(mockModelAdapter.getIndex).toHaveBeenCalledWith('GSI', 'GSI1')
      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          partitionKeyCondition: {
            attributeName: 'GSI1PK',
            operator: QueryConditionOperator.EQUALS,
            attributeValue: `LOCATION#${countryCode}-${geoPartition}#BG#${requestedBloodGroup}#DONATIONSTATUS#true`
          },
          sortKeyCondition: {
            attributeName: 'GSI1SK',
            operator: QueryConditionOperator.BEGINS_WITH,
            attributeValue: geohash
          },
          options: {
            exclusiveStartKey: undefined
          }
        }),
        'GSI1',
        ['PK', 'SK', 'GSI1PK', 'GSI1SK']
      )
    })

    it('should query without sort key condition when geohash is empty', async () => {
      const mockLocations: LocationDTO[] = [
        {
          userId: 'user-1',
          locationId: 'location-1',
          area: 'Dhaka',
          countryCode: 'BD',
          latitude: 23.8103,
          longitude: 90.4125,
          geohash: 'w3gw2v',
          createdAt: '2024-01-01T00:00:00.000Z',
          bloodGroup: 'A+',
          availableForDonation: true,
          lastVaccinatedDate: '2023-12-01'
        }
      ]

      const mockModelAdapter = {
        getIndex: jest.fn().mockReturnValue({
          partitionKey: 'GSI1PK',
          sortKey: 'GSI1SK'
        })
      }

      Object.defineProperty(geohashDynamoDbOperations, 'modelAdapter', {
        value: mockModelAdapter,
        writable: true
      })

      const mockQuery = jest.fn().mockResolvedValue({
        items: mockLocations,
        lastEvaluatedKey: undefined
      })
      DynamoDbTableOperations.prototype.query = mockQuery

      await geohashDynamoDbOperations.queryGeohash(
        countryCode,
        geoPartition,
        requestedBloodGroup,
        '',
        undefined
      )

      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          partitionKeyCondition: {
            attributeName: 'GSI1PK',
            operator: QueryConditionOperator.EQUALS,
            attributeValue: `LOCATION#${countryCode}-${geoPartition}#BG#${requestedBloodGroup}#DONATIONSTATUS#true`
          },
          options: {
            exclusiveStartKey: undefined
          }
        }),
        'GSI1',
        ['PK', 'SK', 'GSI1PK', 'GSI1SK']
      )

      const callArgs = mockQuery.mock.calls[0][0]
      expect(callArgs.sortKeyCondition).toBeUndefined()
    })

    it('should handle pagination with lastEvaluatedKey', async () => {
      const lastEvaluatedKey = {
        PK: 'USER#user-1',
        SK: 'LOCATION#location-1',
        GSI1PK: 'LOCATION#BD-w3g#BG#A+#DONATIONSTATUS#true',
        GSI1SK: 'w3gw2v'
      }

      const mockLocations: LocationDTO[] = [
        {
          userId: 'user-3',
          locationId: 'location-3',
          area: 'Gulshan, Dhaka',
          countryCode: 'BD',
          latitude: 23.7805,
          longitude: 90.4202,
          geohash: 'w3gw2v5k',
          createdAt: '2024-01-03T00:00:00.000Z',
          bloodGroup: 'A+',
          availableForDonation: true,
          lastVaccinatedDate: '2023-12-01'
        }
      ]

      const mockModelAdapter = {
        getIndex: jest.fn().mockReturnValue({
          partitionKey: 'GSI1PK',
          sortKey: 'GSI1SK'
        })
      }

      Object.defineProperty(geohashDynamoDbOperations, 'modelAdapter', {
        value: mockModelAdapter,
        writable: true
      })

      const mockQuery = jest.fn().mockResolvedValue({
        items: mockLocations,
        lastEvaluatedKey: undefined
      })
      DynamoDbTableOperations.prototype.query = mockQuery

      const result = await geohashDynamoDbOperations.queryGeohash(
        countryCode,
        geoPartition,
        requestedBloodGroup,
        geohash,
        lastEvaluatedKey
      )

      expect(result.items).toEqual(mockLocations)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          options: {
            exclusiveStartKey: lastEvaluatedKey
          }
        }),
        'GSI1',
        ['PK', 'SK', 'GSI1PK', 'GSI1SK']
      )
    })

    it('should return lastEvaluatedKey for next page', async () => {
      const nextPageKey = {
        PK: 'USER#user-5',
        SK: 'LOCATION#location-5',
        GSI1PK: 'LOCATION#BD-w3g#BG#A+#DONATIONSTATUS#true',
        GSI1SK: 'w3gw2v9k'
      }

      const mockLocations: LocationDTO[] = [
        {
          userId: 'user-4',
          locationId: 'location-4',
          area: 'Banani, Dhaka',
          countryCode: 'BD',
          latitude: 23.7937,
          longitude: 90.4066,
          geohash: 'w3gw2v6k',
          createdAt: '2024-01-04T00:00:00.000Z',
          bloodGroup: 'A+',
          availableForDonation: true,
          lastVaccinatedDate: '2023-12-01'
        }
      ]

      const mockModelAdapter = {
        getIndex: jest.fn().mockReturnValue({
          partitionKey: 'GSI1PK',
          sortKey: 'GSI1SK'
        })
      }

      Object.defineProperty(geohashDynamoDbOperations, 'modelAdapter', {
        value: mockModelAdapter,
        writable: true
      })

      const mockQuery = jest.fn().mockResolvedValue({
        items: mockLocations,
        lastEvaluatedKey: nextPageKey
      })
      DynamoDbTableOperations.prototype.query = mockQuery

      const result = await geohashDynamoDbOperations.queryGeohash(
        countryCode,
        geoPartition,
        requestedBloodGroup,
        geohash,
        undefined
      )

      expect(result.items).toEqual(mockLocations)
      expect(result.lastEvaluatedKey).toEqual(nextPageKey)
    })

    it('should throw error when GSI1 index is not found', async () => {
      const mockModelAdapter = {
        getIndex: jest.fn().mockReturnValue(undefined)
      }

      Object.defineProperty(geohashDynamoDbOperations, 'modelAdapter', {
        value: mockModelAdapter,
        writable: true
      })

      await expect(
        geohashDynamoDbOperations.queryGeohash(
          countryCode,
          geoPartition,
          requestedBloodGroup,
          geohash,
          undefined
        )
      ).rejects.toThrow('Index not found.')

      expect(mockModelAdapter.getIndex).toHaveBeenCalledWith('GSI', 'GSI1')
    })

    it('should return empty items array when no matches found', async () => {
      const mockModelAdapter = {
        getIndex: jest.fn().mockReturnValue({
          partitionKey: 'GSI1PK',
          sortKey: 'GSI1SK'
        })
      }

      Object.defineProperty(geohashDynamoDbOperations, 'modelAdapter', {
        value: mockModelAdapter,
        writable: true
      })

      const mockQuery = jest.fn().mockResolvedValue({
        items: [],
        lastEvaluatedKey: undefined
      })
      DynamoDbTableOperations.prototype.query = mockQuery

      const result = await geohashDynamoDbOperations.queryGeohash(
        countryCode,
        geoPartition,
        requestedBloodGroup,
        geohash,
        undefined
      )

      expect(result.items).toEqual([])
      expect(result.lastEvaluatedKey).toBeUndefined()
    })

    it('should format partition key correctly with country, geoPartition and blood group', async () => {
      const mockModelAdapter = {
        getIndex: jest.fn().mockReturnValue({
          partitionKey: 'GSI1PK',
          sortKey: 'GSI1SK'
        })
      }

      Object.defineProperty(geohashDynamoDbOperations, 'modelAdapter', {
        value: mockModelAdapter,
        writable: true
      })

      const mockQuery = jest.fn().mockResolvedValue({
        items: [],
        lastEvaluatedKey: undefined
      })
      DynamoDbTableOperations.prototype.query = mockQuery

      await geohashDynamoDbOperations.queryGeohash(
        'US',
        'xyz',
        'O-',
        'xyzabc',
        undefined
      )

      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          partitionKeyCondition: expect.objectContaining({
            attributeValue: 'LOCATION#US-xyz#BG#O-#DONATIONSTATUS#true'
          })
        }),
        'GSI1',
        ['PK', 'SK', 'GSI1PK', 'GSI1SK']
      )
    })

    it('should handle different blood groups correctly', async () => {
      const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

      const mockModelAdapter = {
        getIndex: jest.fn().mockReturnValue({
          partitionKey: 'GSI1PK',
          sortKey: 'GSI1SK'
        })
      }

      Object.defineProperty(geohashDynamoDbOperations, 'modelAdapter', {
        value: mockModelAdapter,
        writable: true
      })

      const mockQuery = jest.fn().mockResolvedValue({
        items: [],
        lastEvaluatedKey: undefined
      })
      DynamoDbTableOperations.prototype.query = mockQuery

      for (const bloodGroup of bloodGroups) {
        mockQuery.mockClear()

        await geohashDynamoDbOperations.queryGeohash(
          countryCode,
          geoPartition,
          bloodGroup,
          geohash,
          undefined
        )

        expect(mockQuery).toHaveBeenCalledWith(
          expect.objectContaining({
            partitionKeyCondition: expect.objectContaining({
              attributeValue: `LOCATION#${countryCode}-${geoPartition}#BG#${bloodGroup}#DONATIONSTATUS#true`
            })
          }),
          'GSI1',
          ['PK', 'SK', 'GSI1PK', 'GSI1SK']
        )
      }
    })

    it('should use BEGINS_WITH operator for geohash sort key', async () => {
      const mockModelAdapter = {
        getIndex: jest.fn().mockReturnValue({
          partitionKey: 'GSI1PK',
          sortKey: 'GSI1SK'
        })
      }

      Object.defineProperty(geohashDynamoDbOperations, 'modelAdapter', {
        value: mockModelAdapter,
        writable: true
      })

      const mockQuery = jest.fn().mockResolvedValue({
        items: [],
        lastEvaluatedKey: undefined
      })
      DynamoDbTableOperations.prototype.query = mockQuery

      await geohashDynamoDbOperations.queryGeohash(
        countryCode,
        geoPartition,
        requestedBloodGroup,
        'w3g',
        undefined
      )

      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          sortKeyCondition: expect.objectContaining({
            operator: QueryConditionOperator.BEGINS_WITH,
            attributeValue: 'w3g'
          })
        }),
        'GSI1',
        ['PK', 'SK', 'GSI1PK', 'GSI1SK']
      )
    })

    it('should request specific attributes only', async () => {
      const mockModelAdapter = {
        getIndex: jest.fn().mockReturnValue({
          partitionKey: 'GSI1PK',
          sortKey: 'GSI1SK'
        })
      }

      Object.defineProperty(geohashDynamoDbOperations, 'modelAdapter', {
        value: mockModelAdapter,
        writable: true
      })

      const mockQuery = jest.fn().mockResolvedValue({
        items: [],
        lastEvaluatedKey: undefined
      })
      DynamoDbTableOperations.prototype.query = mockQuery

      await geohashDynamoDbOperations.queryGeohash(
        countryCode,
        geoPartition,
        requestedBloodGroup,
        geohash,
        undefined
      )

      expect(mockQuery).toHaveBeenCalledWith(
        expect.anything(),
        'GSI1',
        ['PK', 'SK', 'GSI1PK', 'GSI1SK']
      )
    })

    it('should handle index with null sort key', async () => {
      const mockModelAdapter = {
        getIndex: jest.fn().mockReturnValue({
          partitionKey: 'GSI1PK',
          sortKey: null
        })
      }

      Object.defineProperty(geohashDynamoDbOperations, 'modelAdapter', {
        value: mockModelAdapter,
        writable: true
      })

      const mockQuery = jest.fn().mockResolvedValue({
        items: [],
        lastEvaluatedKey: undefined
      })
      DynamoDbTableOperations.prototype.query = mockQuery

      await geohashDynamoDbOperations.queryGeohash(
        countryCode,
        geoPartition,
        requestedBloodGroup,
        geohash,
        undefined
      )

      const callArgs = mockQuery.mock.calls[0][0]
      expect(callArgs.sortKeyCondition).toBeUndefined()
    })

    it('should handle complex geohash patterns', async () => {
      const complexGeohashes = ['w', 'w3', 'w3g', 'w3gw', 'w3gw2', 'w3gw2v', 'w3gw2v3k']

      const mockModelAdapter = {
        getIndex: jest.fn().mockReturnValue({
          partitionKey: 'GSI1PK',
          sortKey: 'GSI1SK'
        })
      }

      Object.defineProperty(geohashDynamoDbOperations, 'modelAdapter', {
        value: mockModelAdapter,
        writable: true
      })

      const mockQuery = jest.fn().mockResolvedValue({
        items: [],
        lastEvaluatedKey: undefined
      })
      DynamoDbTableOperations.prototype.query = mockQuery

      for (const hash of complexGeohashes) {
        mockQuery.mockClear()

        await geohashDynamoDbOperations.queryGeohash(
          countryCode,
          geoPartition,
          requestedBloodGroup,
          hash,
          undefined
        )

        expect(mockQuery).toHaveBeenCalledWith(
          expect.objectContaining({
            sortKeyCondition: expect.objectContaining({
              attributeValue: hash
            })
          }),
          'GSI1',
          ['PK', 'SK', 'GSI1PK', 'GSI1SK']
        )
      }
    })

    it('should always use GSI1 index name', async () => {
      const mockModelAdapter = {
        getIndex: jest.fn().mockReturnValue({
          partitionKey: 'GSI1PK',
          sortKey: 'GSI1SK'
        })
      }

      Object.defineProperty(geohashDynamoDbOperations, 'modelAdapter', {
        value: mockModelAdapter,
        writable: true
      })

      const mockQuery = jest.fn().mockResolvedValue({
        items: [],
        lastEvaluatedKey: undefined
      })
      DynamoDbTableOperations.prototype.query = mockQuery

      await geohashDynamoDbOperations.queryGeohash(
        countryCode,
        geoPartition,
        requestedBloodGroup,
        geohash,
        undefined
      )

      expect(mockQuery).toHaveBeenCalledWith(
        expect.anything(),
        'GSI1',
        expect.anything()
      )
    })

    it('should handle multiple locations in same geohash area', async () => {
      const mockLocations: LocationDTO[] = Array.from({ length: 10 }, (_, i) => ({
        userId: `user-${i}`,
        locationId: `location-${i}`,
        area: `Area ${i}, Dhaka`,
        countryCode: 'BD',
        latitude: 23.8103 + i * 0.0001,
        longitude: 90.4125 + i * 0.0001,
        geohash: `w3gw2v${i}k`,
        createdAt: `2024-01-0${i + 1}T00:00:00.000Z`,
        bloodGroup: 'A+',
        availableForDonation: true,
        lastVaccinatedDate: '2023-12-01'
      }))

      const mockModelAdapter = {
        getIndex: jest.fn().mockReturnValue({
          partitionKey: 'GSI1PK',
          sortKey: 'GSI1SK'
        })
      }

      Object.defineProperty(geohashDynamoDbOperations, 'modelAdapter', {
        value: mockModelAdapter,
        writable: true
      })

      const mockQuery = jest.fn().mockResolvedValue({
        items: mockLocations,
        lastEvaluatedKey: undefined
      })
      DynamoDbTableOperations.prototype.query = mockQuery

      const result = await geohashDynamoDbOperations.queryGeohash(
        countryCode,
        geoPartition,
        requestedBloodGroup,
        geohash,
        undefined
      )

      expect(result.items).toHaveLength(10)
      expect(result.items).toEqual(mockLocations)
    })
  })
})
