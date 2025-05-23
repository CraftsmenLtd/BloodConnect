import {
  BloodDonationModel,
  BLOOD_REQUEST_PK_PREFIX,
  BLOOD_REQUEST_LSI1SK_PREFIX,
  DonationFields
} from '../../commons/ddbModels/BloodDonationModel'
import {
  DonationStatus
} from '../../../../../commons/dto/DonationDTO'
import {
  donationDtoMock,
  donationFieldsMock
} from '../../../../application/tests/mocks/mockDonationRequestData'
import { GEO_PARTITION_PREFIX_LENGTH } from '../../../../../commons/libs/constants/NoMagicNumbers'

jest.useFakeTimers()

describe('BloodDonationModel', () => {
  const bloodDonationModel = new BloodDonationModel()
  const mockCreatedAt = '2024-10-10T00:00:00Z'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  describe('fromDto', () => {
    it('should correctly convert DonationDTO to DonationFields', () => {
      const result = bloodDonationModel.fromDto({
        ...donationDtoMock,
        createdAt: mockCreatedAt
      })

      expect(result).toEqual({
        ...donationFieldsMock,
        PK: `${BLOOD_REQUEST_PK_PREFIX}#${donationDtoMock.seekerId}`,
        SK: `${BLOOD_REQUEST_PK_PREFIX}#${mockCreatedAt}#${donationDtoMock.requestPostId}`,
        LSI1SK: `${BLOOD_REQUEST_LSI1SK_PREFIX}#${DonationStatus.PENDING}#${donationDtoMock.requestPostId}`,
        GSI1SK: `${mockCreatedAt}#BG#${donationDtoMock.requestedBloodGroup}`,
        createdAt: mockCreatedAt
      })
    })

    it('should properly format SK and LSI1SK with provided createdAt', () => {
      const customCreatedAt = '2024-02-15T12:00:00Z'
      const result = bloodDonationModel.fromDto({
        ...donationDtoMock,
        createdAt: customCreatedAt
      })

      expect(result.SK).toBe(
        `${BLOOD_REQUEST_PK_PREFIX}#${customCreatedAt}#${donationDtoMock.requestPostId}`
      )
      expect(result.LSI1SK).toBe(
        `${BLOOD_REQUEST_LSI1SK_PREFIX}#${DonationStatus.PENDING}#${donationDtoMock.requestPostId}`
      )
    })
  })

  describe('toDto', () => {
    it('should correctly convert DonationFields to DonationDTO', () => {
      const fields: DonationFields = {
        ...donationFieldsMock,
        createdAt: mockCreatedAt,
        PK: `${BLOOD_REQUEST_PK_PREFIX}#${donationDtoMock.seekerId}`,
        SK: `${BLOOD_REQUEST_PK_PREFIX}#${mockCreatedAt}#${donationDtoMock.requestPostId}` as const,
        LSI1SK: `${BLOOD_REQUEST_LSI1SK_PREFIX}#${DonationStatus.PENDING}#${donationDtoMock.requestPostId}`
      }

      const result = bloodDonationModel.toDto(fields)

      const geoPartition = donationDtoMock.geohash.slice(0, GEO_PARTITION_PREFIX_LENGTH)
      expect(result).toEqual({
        GSI1PK: `LOCATION#${donationDtoMock.countryCode}-${geoPartition}#STATUS#${DonationStatus.PENDING}`,
        GSI1SK: `${donationFieldsMock.createdAt}#BG#${donationDtoMock.requestedBloodGroup}`,
        ...donationDtoMock,
        requestPostId: donationDtoMock.requestPostId,
        seekerId: donationDtoMock.seekerId,
        createdAt: mockCreatedAt
      })
    })

    it('should correctly extract id and seekerId from SK and PK', () => {
      const customFields: DonationFields = {
        ...donationFieldsMock,
        createdAt: mockCreatedAt,
        PK: `${BLOOD_REQUEST_PK_PREFIX}#custom-seeker-id`,
        SK: `${BLOOD_REQUEST_PK_PREFIX}#${mockCreatedAt}#custom-request-id`,
        LSI1SK: `${BLOOD_REQUEST_LSI1SK_PREFIX}#${DonationStatus.PENDING}#custom-request-id`
      }

      const result = bloodDonationModel.toDto(customFields)

      expect(result.requestPostId).toBe('custom-request-id')
      expect(result.seekerId).toBe('custom-seeker-id')
    })
  })

  describe('getPrimaryIndex', () => {
    it('should return the correct primary index', () => {
      const result = bloodDonationModel.getPrimaryIndex()
      expect(result).toEqual({ partitionKey: 'PK', sortKey: 'SK' })
    })
  })

  describe('getIndex', () => {
    beforeEach(() => {
      jest.restoreAllMocks()
    })

    test.each([
      {
        name: 'unknown index',
        indexDefinitions: {},
        indexType: 'GSI' as const,
        indexName: 'unknownIndex'
      },
      {
        name: 'non-existent index type',
        indexDefinitions: { GSI: {} },
        indexType: 'LSI' as const,
        indexName: 'anyIndex'
      },
      {
        name: 'empty index definitions',
        indexDefinitions: {},
        indexType: 'GSI' as const,
        indexName: 'anyIndex'
      },
      {
        name: 'LSI index type',
        indexDefinitions: { LSI: {}, GSI: {} },
        indexType: 'LSI' as const,
        indexName: 'testIndex'
      },
      {
        name: 'GSI index type',
        indexDefinitions: { LSI: {}, GSI: {} },
        indexType: 'GSI' as const,
        indexName: 'testIndex'
      }
    ])(
      'should return undefined for $name',
      ({ indexDefinitions, indexType, indexName }) => {
        jest
          .spyOn(bloodDonationModel, 'getIndexDefinitions')
          .mockReturnValue(indexDefinitions)

        const result = bloodDonationModel.getIndex(indexType, indexName)

        expect(result).toBeUndefined()
      }
    )
  })

  describe('getIndexDefinitions', () => {
    beforeEach(() => {
      jest.restoreAllMocks()
    })

    it('should return empty object', () => {
      const result = bloodDonationModel.getIndexDefinitions()
      expect(result).toEqual({
        GSI: {
          GSI1: {
            partitionKey: 'GSI1PK',
            sortKey: 'GSI1SK'
          }
        }
      })
    })

    it('should always return a new empty object instance', () => {
      const result1 = bloodDonationModel.getIndexDefinitions()
      const result2 = bloodDonationModel.getIndexDefinitions()

      expect(result1).toEqual({
        GSI: {
          GSI1: {
            partitionKey: 'GSI1PK',
            sortKey: 'GSI1SK'
          }
        }
      })
      expect(result2).toEqual({
        GSI: {
          GSI1: {
            partitionKey: 'GSI1PK',
            sortKey: 'GSI1SK'
          }
        }
      })
      expect(result1).not.toBe(result2)
    })
  })
})
