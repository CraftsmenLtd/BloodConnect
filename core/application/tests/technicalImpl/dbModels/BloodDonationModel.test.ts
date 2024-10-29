import { BloodDonationModel, BLOOD_REQUEST_PK_PREFIX, BLOOD_REQUEST_LSISK_PREFIX, DonationFields } from '../../../technicalImpl/dbModels/BloodDonationModel'
import { DonationDTO, DonationStatus } from '../../../../../commons/dto/DonationDTO'
import { donationDtoMock, donationFieldsMock } from '../../mocks/mockDonationRequestData'

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
        SK: `${BLOOD_REQUEST_PK_PREFIX}#${mockCreatedAt}#${donationDtoMock.id}`,
        LSI1SK: `${BLOOD_REQUEST_LSISK_PREFIX}#${DonationStatus.PENDING}#${donationDtoMock.id}`,
        createdAt: mockCreatedAt
      })
    })

    it('should use current date when createdAt is undefined', () => {
      const mockDate = new Date('2024-01-01T00:00:00Z')
      jest.setSystemTime(mockDate)

      const dtoWithoutCreatedAt: DonationDTO = {
        ...donationDtoMock,
        createdAt: undefined
      }

      const result = bloodDonationModel.fromDto(dtoWithoutCreatedAt)

      expect(result.createdAt).toBe(mockDate.toISOString())
      expect(result.SK).toBe(`${BLOOD_REQUEST_PK_PREFIX}#${mockDate.toISOString()}#${donationDtoMock.id}`)
    })

    it('should use current date when createdAt is omitted', () => {
      const mockDate = new Date('2024-01-01T00:00:00Z')
      jest.setSystemTime(mockDate)

      const { createdAt, ...dtoWithoutCreatedAt } = donationDtoMock

      const result = bloodDonationModel.fromDto(dtoWithoutCreatedAt)

      expect(result.createdAt).toBe(mockDate.toISOString())
      expect(result.SK).toBe(`${BLOOD_REQUEST_PK_PREFIX}#${mockDate.toISOString()}#${donationDtoMock.id}`)
    })

    it('should properly format SK and LSI1SK with provided createdAt', () => {
      const customCreatedAt = '2024-02-15T12:00:00Z'
      const result = bloodDonationModel.fromDto({
        ...donationDtoMock,
        createdAt: customCreatedAt
      })

      expect(result.SK).toBe(`${BLOOD_REQUEST_PK_PREFIX}#${customCreatedAt}#${donationDtoMock.id}`)
      expect(result.LSI1SK).toBe(`${BLOOD_REQUEST_LSISK_PREFIX}#${DonationStatus.PENDING}#${donationDtoMock.id}`)
    })
  })

  describe('toDto', () => {
    it('should correctly convert DonationFields to DonationDTO', () => {
      const fields: DonationFields = {
        ...donationFieldsMock,
        createdAt: mockCreatedAt,
        PK: `${BLOOD_REQUEST_PK_PREFIX}#${donationDtoMock.seekerId}`,
        SK: `${BLOOD_REQUEST_PK_PREFIX}#${mockCreatedAt}#${donationDtoMock.id}` as const,
        LSI1SK: `${BLOOD_REQUEST_LSISK_PREFIX}#${DonationStatus.PENDING}#${donationDtoMock.id}`
      }

      const result = bloodDonationModel.toDto(fields)

      expect(result).toEqual({
        ...donationDtoMock,
        id: donationDtoMock.id,
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
        LSI1SK: `${BLOOD_REQUEST_LSISK_PREFIX}#${DonationStatus.PENDING}#custom-request-id`
      }

      const result = bloodDonationModel.toDto(customFields)

      expect(result.id).toBe('custom-request-id')
      expect(result.seekerId).toBe('custom-seeker-id')
    })

    it('should preserve all other fields during conversion', () => {
      const customFields: DonationFields = {
        ...donationFieldsMock,
        createdAt: mockCreatedAt,
        PK: `${BLOOD_REQUEST_PK_PREFIX}#${donationDtoMock.seekerId}`,
        SK: `${BLOOD_REQUEST_PK_PREFIX}#${mockCreatedAt}#${donationDtoMock.id}`,
        LSI1SK: `${BLOOD_REQUEST_LSISK_PREFIX}#${DonationStatus.PENDING}#${donationDtoMock.id}`,
        contactInfo: {
          name: 'Custom Name',
          phone: 'Custom Phone'
        },
        bloodQuantity: 5
      }

      const result = bloodDonationModel.toDto(customFields)

      expect(result.contactInfo).toEqual({
        name: 'Custom Name',
        phone: 'Custom Phone'
      })
      expect(result.bloodQuantity).toBe(5)
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

    it('should return undefined for an unknown index', () => {
      const indexDefinitions = {}
      jest.spyOn(bloodDonationModel, 'getIndexDefinitions').mockReturnValue(indexDefinitions)

      const result = bloodDonationModel.getIndex('GSI', 'unknownIndex')
      expect(result).toBeUndefined()
    })

    it('should return undefined when index type does not exist', () => {
      const indexDefinitions = { GSI: {} }
      jest.spyOn(bloodDonationModel, 'getIndexDefinitions').mockReturnValue(indexDefinitions)

      const result = bloodDonationModel.getIndex('LSI', 'anyIndex')
      expect(result).toBeUndefined()
    })

    it('should handle empty index definitions', () => {
      const indexDefinitions = {}
      jest.spyOn(bloodDonationModel, 'getIndexDefinitions').mockReturnValue(indexDefinitions)

      const result = bloodDonationModel.getIndex('GSI', 'anyIndex')
      expect(result).toBeUndefined()
    })

    it('should return undefined for different index types', () => {
      const indexDefinitions = {
        LSI: {},
        GSI: {}
      }
      jest.spyOn(bloodDonationModel, 'getIndexDefinitions').mockReturnValue(indexDefinitions)

      const result1 = bloodDonationModel.getIndex('LSI', 'testIndex')
      const result2 = bloodDonationModel.getIndex('GSI', 'testIndex')

      expect(result1).toBeUndefined()
      expect(result2).toBeUndefined()
    })
  })

  describe('getIndexDefinitions', () => {
    beforeEach(() => {
      jest.restoreAllMocks()
    })

    it('should return empty object', () => {
      const result = bloodDonationModel.getIndexDefinitions()
      expect(result).toEqual({})
    })

    it('should always return a new empty object instance', () => {
      const result1 = bloodDonationModel.getIndexDefinitions()
      const result2 = bloodDonationModel.getIndexDefinitions()

      expect(result1).toEqual({})
      expect(result2).toEqual({})
      expect(result1).not.toBe(result2)
    })
  })
})
