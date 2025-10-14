import {
  DonorSearchModel,
  DONOR_SEARCH_PK_PREFIX,
  DONOR_SEARCH_LSISK_PREFIX
} from '../../commons/ddbModels/DonorSearchModel'
import { DonationStatus } from '../../../../../commons/dto/DonationDTO'
import type { DonorSearchDTO } from '../../../../../commons/dto/DonationDTO'

describe('DonorSearchModel', () => {
  let model: DonorSearchModel

  beforeEach(() => {
    model = new DonorSearchModel()
    // Mock Date to have consistent timestamps in tests
    jest.spyOn(global, 'Date').mockImplementation(
      () =>
        ({
          toISOString: () => '2024-01-01T00:00:00.000Z'
        }) as unknown as Date
    )
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('getPrimaryIndex', () => {
    it('should return correct primary index definition', () => {
      const primaryIndex = model.getPrimaryIndex()

      expect(primaryIndex).toEqual({
        partitionKey: 'PK',
        sortKey: 'SK'
      })
    })
  })

  describe('getIndexDefinitions', () => {
    it('should return empty object for index definitions', () => {
      const indexDefinitions = model.getIndexDefinitions()

      expect(indexDefinitions).toEqual({})
    })
  })

  describe('getIndex', () => {
    it('should return undefined for any index type and name', () => {
      const gsiIndex = model.getIndex('GSI', 'GSI1')
      const lsiIndex = model.getIndex('LSI', 'LSI1')

      expect(gsiIndex).toBeUndefined()
      expect(lsiIndex).toBeUndefined()
    })
  })

  describe('fromDto', () => {
    it('should convert DonorSearchDTO to DonorSearchFields correctly', () => {
      const dto: DonorSearchDTO = {
        seekerId: 'test-seeker-id',
        requestPostId: 'test-request-post-id',
        createdAt: '2024-01-15T10:30:00.000Z',
        bloodGroup: 'A+',
        location: 'City Hospital',
        geohash: 'abc123'
      }

      const fields = model.fromDto(dto)

      expect(fields.PK).toBe(`${DONOR_SEARCH_PK_PREFIX}#test-seeker-id`)
      expect(fields.SK).toBe(`${DONOR_SEARCH_PK_PREFIX}#2024-01-15T10:30:00.000Z#test-request-post-id`)
      expect(fields.LSI1SK).toBe(`${DONOR_SEARCH_LSISK_PREFIX}#${DonationStatus.PENDING}#test-request-post-id`)
      expect(fields.bloodGroup).toBe('A+')
      expect(fields.location).toBe('City Hospital')
      expect(fields.geohash).toBe('abc123')
      expect(fields.createdAt).toBe('2024-01-15T10:30:00.000Z')
      expect(fields).not.toHaveProperty('seekerId')
      expect(fields).not.toHaveProperty('requestPostId')
    })

    it('should use current date when createdAt is not provided', () => {
      const dto: DonorSearchDTO = {
        seekerId: 'test-seeker-id',
        requestPostId: 'test-request-post-id',
        bloodGroup: 'B+',
        location: 'General Hospital',
        geohash: 'xyz789'
      }

      const fields = model.fromDto(dto)

      expect(fields.createdAt).toBe('2024-01-01T00:00:00.000Z')
      expect(fields.SK).toContain('2024-01-01T00:00:00.000Z')
    })

    it('should always set LSI1SK with PENDING status', () => {
      const dto: DonorSearchDTO = {
        seekerId: 'test-seeker-id',
        requestPostId: 'test-request-post-id',
        createdAt: '2024-01-15T10:30:00.000Z',
        bloodGroup: 'O-',
        location: 'Hospital',
        geohash: 'abc'
      }

      const fields = model.fromDto(dto)

      expect(fields.LSI1SK).toBe(`${DONOR_SEARCH_LSISK_PREFIX}#${DonationStatus.PENDING}#test-request-post-id`)
    })

    it('should preserve additional DTO fields', () => {
      const dto: DonorSearchDTO = {
        seekerId: 'test-seeker-id',
        requestPostId: 'test-request-post-id',
        createdAt: '2024-01-15T10:30:00.000Z',
        bloodGroup: 'AB+',
        location: 'Emergency Hospital',
        geohash: 'def456',
        urgency: 'HIGH',
        donorsNeeded: 3,
        description: 'Urgent blood needed'
      }

      const fields = model.fromDto(dto)

      expect(fields.urgency).toBe('HIGH')
      expect(fields.donorsNeeded).toBe(3)
      expect(fields.description).toBe('Urgent blood needed')
    })

    it('should handle complex IDs with special characters', () => {
      const dto: DonorSearchDTO = {
        seekerId: 'seeker-id-with-dashes-123',
        requestPostId: 'request-post-id-with-underscores_456',
        createdAt: '2024-12-31T23:59:59.999Z',
        bloodGroup: 'A+',
        location: 'Hospital',
        geohash: 'abc'
      }

      const fields = model.fromDto(dto)

      expect(fields.PK).toContain('seeker-id-with-dashes-123')
      expect(fields.SK).toContain('request-post-id-with-underscores_456')
      expect(fields.LSI1SK).toContain('request-post-id-with-underscores_456')
    })
  })

  describe('toDto', () => {
    it('should convert DonorSearchFields to DonorSearchDTO correctly', () => {
      const fields = {
        PK: `${DONOR_SEARCH_PK_PREFIX}#test-seeker-id` as const,
        SK: `${DONOR_SEARCH_PK_PREFIX}#2024-01-15T10:30:00.000Z#test-request-post-id` as const,
        LSI1SK: `${DONOR_SEARCH_LSISK_PREFIX}#${DonationStatus.PENDING}#test-request-post-id` as const,
        createdAt: '2024-01-15T10:30:00.000Z',
        bloodGroup: 'A+',
        location: 'City Hospital',
        geohash: 'abc123'
      }

      const dto = model.toDto(fields)

      expect(dto.seekerId).toBe('test-seeker-id')
      expect(dto.requestPostId).toBe('test-request-post-id')
      expect(dto.createdAt).toBe('2024-01-15T10:30:00.000Z')
      expect(dto.bloodGroup).toBe('A+')
      expect(dto.location).toBe('City Hospital')
      expect(dto.geohash).toBe('abc123')
      expect(dto).not.toHaveProperty('PK')
      expect(dto).not.toHaveProperty('SK')
      expect(dto).not.toHaveProperty('LSI1SK')
    })

    it('should extract seekerId from PK correctly', () => {
      const fields = {
        PK: `${DONOR_SEARCH_PK_PREFIX}#complex-seeker-id-123` as const,
        SK: `${DONOR_SEARCH_PK_PREFIX}#2024-01-15T10:30:00.000Z#request` as const,
        LSI1SK: `${DONOR_SEARCH_LSISK_PREFIX}#${DonationStatus.PENDING}#request` as const,
        createdAt: '2024-01-15T10:30:00.000Z',
        bloodGroup: 'A+',
        location: 'Hospital',
        geohash: 'abc'
      }

      const dto = model.toDto(fields)

      expect(dto.seekerId).toBe('complex-seeker-id-123')
    })

    it('should extract requestPostId from SK correctly using createdAt', () => {
      const fields = {
        PK: `${DONOR_SEARCH_PK_PREFIX}#seeker` as const,
        SK: `${DONOR_SEARCH_PK_PREFIX}#2024-01-15T10:30:00.000Z#complex-request-post-id-456` as const,
        LSI1SK: `${DONOR_SEARCH_LSISK_PREFIX}#${DonationStatus.PENDING}#complex-request-post-id-456` as const,
        createdAt: '2024-01-15T10:30:00.000Z',
        bloodGroup: 'B+',
        location: 'Hospital',
        geohash: 'xyz'
      }

      const dto = model.toDto(fields)

      expect(dto.requestPostId).toBe('complex-request-post-id-456')
    })

    it('should preserve createdAt field', () => {
      const fields = {
        PK: `${DONOR_SEARCH_PK_PREFIX}#seeker` as const,
        SK: `${DONOR_SEARCH_PK_PREFIX}#2024-12-31T23:59:59.999Z#request` as const,
        LSI1SK: `${DONOR_SEARCH_LSISK_PREFIX}#${DonationStatus.PENDING}#request` as const,
        createdAt: '2024-12-31T23:59:59.999Z',
        bloodGroup: 'O-',
        location: 'Hospital',
        geohash: 'abc'
      }

      const dto = model.toDto(fields)

      expect(dto.createdAt).toBe('2024-12-31T23:59:59.999Z')
    })

    it('should preserve additional fields', () => {
      const fields = {
        PK: `${DONOR_SEARCH_PK_PREFIX}#seeker` as const,
        SK: `${DONOR_SEARCH_PK_PREFIX}#2024-01-15T10:30:00.000Z#request` as const,
        LSI1SK: `${DONOR_SEARCH_LSISK_PREFIX}#${DonationStatus.PENDING}#request` as const,
        createdAt: '2024-01-15T10:30:00.000Z',
        bloodGroup: 'AB+',
        location: 'Emergency Hospital',
        geohash: 'def456',
        urgency: 'HIGH',
        donorsNeeded: 5,
        description: 'Critical case'
      }

      const dto = model.toDto(fields)

      expect(dto.urgency).toBe('HIGH')
      expect(dto.donorsNeeded).toBe(5)
      expect(dto.description).toBe('Critical case')
    })

    it('should handle requestPostId with special characters', () => {
      const fields = {
        PK: `${DONOR_SEARCH_PK_PREFIX}#seeker` as const,
        SK: `${DONOR_SEARCH_PK_PREFIX}#2024-01-15T10:30:00.000Z#request-with-dashes_and_underscores` as const,
        LSI1SK: `${DONOR_SEARCH_LSISK_PREFIX}#${DonationStatus.PENDING}#request-with-dashes_and_underscores` as const,
        createdAt: '2024-01-15T10:30:00.000Z',
        bloodGroup: 'A+',
        location: 'Hospital',
        geohash: 'abc'
      }

      const dto = model.toDto(fields)

      expect(dto.requestPostId).toBe('request-with-dashes_and_underscores')
    })
  })

  describe('roundtrip conversion', () => {
    it('should maintain data integrity through fromDto and toDto', () => {
      const originalDto: DonorSearchDTO = {
        seekerId: 'test-seeker-id',
        requestPostId: 'test-request-post-id',
        createdAt: '2024-01-15T10:30:00.000Z',
        bloodGroup: 'A+',
        location: 'City Hospital',
        geohash: 'abc123',
        urgency: 'MEDIUM',
        donorsNeeded: 2
      }

      const fields = model.fromDto(originalDto)
      const convertedDto = model.toDto(fields)

      expect(convertedDto).toEqual(originalDto)
    })

    it('should handle multiple roundtrip conversions', () => {
      const originalDto: DonorSearchDTO = {
        seekerId: 'seeker-123',
        requestPostId: 'request-456',
        createdAt: '2024-12-31T23:59:59.999Z',
        bloodGroup: 'O-',
        location: 'General Hospital',
        geohash: 'xyz789'
      }

      // First roundtrip
      const fields1 = model.fromDto(originalDto)
      const dto1 = model.toDto(fields1)

      // Second roundtrip
      const fields2 = model.fromDto(dto1)
      const dto2 = model.toDto(fields2)

      expect(dto2).toEqual(originalDto)
      expect(dto1).toEqual(dto2)
    })

    it('should handle DTO without createdAt in roundtrip', () => {
      const originalDto: DonorSearchDTO = {
        seekerId: 'test-seeker-id',
        requestPostId: 'test-request-post-id',
        bloodGroup: 'B+',
        location: 'Hospital',
        geohash: 'abc'
      }

      const fields = model.fromDto(originalDto)
      const convertedDto = model.toDto(fields)

      // createdAt should be added with mocked date
      expect(convertedDto.createdAt).toBe('2024-01-01T00:00:00.000Z')
      expect(convertedDto.seekerId).toBe(originalDto.seekerId)
      expect(convertedDto.requestPostId).toBe(originalDto.requestPostId)
      expect(convertedDto.bloodGroup).toBe(originalDto.bloodGroup)
    })
  })
})
