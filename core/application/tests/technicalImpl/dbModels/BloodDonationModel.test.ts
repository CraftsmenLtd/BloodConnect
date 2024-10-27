import { BloodDonationModel, BLOOD_REQUEST_PK_PREFIX, BLOOD_REQUEST_LSISK_PREFIX, DonationFields } from '../../../technicalImpl/dbModels/BloodDonationModel'
import { DonationDTO, DonationStatus } from '../../../../../commons/dto/DonationDTO'
import { donationDto, donationFields } from '../../mocks/mockDonationRequestData'

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
        ...donationDto,
        createdAt: mockCreatedAt
      })

      expect(result).toEqual({
        ...donationFields,
        PK: `${BLOOD_REQUEST_PK_PREFIX}#${donationDto.seekerId}`,
        SK: `${BLOOD_REQUEST_PK_PREFIX}#${mockCreatedAt}#${donationDto.id}`,
        LSI1SK: `${BLOOD_REQUEST_LSISK_PREFIX}#${DonationStatus.PENDING}#${donationDto.id}`,
        createdAt: mockCreatedAt
      })
    })

    it('should use current date when createdAt is undefined', () => {
      const mockDate = new Date('2024-01-01T00:00:00Z')
      jest.setSystemTime(mockDate)

      const dtoWithoutCreatedAt: DonationDTO = {
        ...donationDto,
        createdAt: undefined
      }

      const result = bloodDonationModel.fromDto(dtoWithoutCreatedAt)

      expect(result.createdAt).toBe(mockDate.toISOString())
      expect(result.SK).toBe(`${BLOOD_REQUEST_PK_PREFIX}#${mockDate.toISOString()}#${donationDto.id}`)
    })

    it('should use current date when createdAt is omitted', () => {
      const mockDate = new Date('2024-01-01T00:00:00Z')
      jest.setSystemTime(mockDate)

      const { createdAt, ...dtoWithoutCreatedAt } = donationDto

      const result = bloodDonationModel.fromDto(dtoWithoutCreatedAt)

      expect(result.createdAt).toBe(mockDate.toISOString())
      expect(result.SK).toBe(`${BLOOD_REQUEST_PK_PREFIX}#${mockDate.toISOString()}#${donationDto.id}`)
    })

    it('should properly format SK and LSI1SK with provided createdAt', () => {
      const customCreatedAt = '2024-02-15T12:00:00Z'
      const result = bloodDonationModel.fromDto({
        ...donationDto,
        createdAt: customCreatedAt
      })

      expect(result.SK).toBe(`${BLOOD_REQUEST_PK_PREFIX}#${customCreatedAt}#${donationDto.id}`)
      expect(result.LSI1SK).toBe(`${BLOOD_REQUEST_LSISK_PREFIX}#${DonationStatus.PENDING}#${donationDto.id}`)
    })
  })

  describe('toDto', () => {
    it('should correctly convert DonationFields to DonationDTO', () => {
      const fields: DonationFields = {
        ...donationFields,
        createdAt: mockCreatedAt,
        PK: `${BLOOD_REQUEST_PK_PREFIX}#${donationDto.seekerId}`,
        SK: `${BLOOD_REQUEST_PK_PREFIX}#${mockCreatedAt}#${donationDto.id}` as const,
        LSI1SK: `${BLOOD_REQUEST_LSISK_PREFIX}#${DonationStatus.PENDING}#${donationDto.id}`
      }

      const result = bloodDonationModel.toDto(fields)

      expect(result).toEqual({
        ...donationDto,
        id: donationDto.id,
        seekerId: donationDto.seekerId,
        createdAt: mockCreatedAt
      })
    })

    it('should correctly extract id and seekerId from SK and PK', () => {
      const customFields: DonationFields = {
        ...donationFields,
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
        ...donationFields,
        createdAt: mockCreatedAt,
        PK: `${BLOOD_REQUEST_PK_PREFIX}#${donationDto.seekerId}`,
        SK: `${BLOOD_REQUEST_PK_PREFIX}#${mockCreatedAt}#${donationDto.id}`,
        LSI1SK: `${BLOOD_REQUEST_LSISK_PREFIX}#${DonationStatus.PENDING}#${donationDto.id}`,
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
