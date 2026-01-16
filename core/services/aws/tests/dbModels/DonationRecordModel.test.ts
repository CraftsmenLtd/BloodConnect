import {
  DonationRecordModel,
  DONATION_RECORD_PK_PREFIX
} from '../../commons/ddbModels/DonationRecordModel'
import type { DonationRecordDTO } from '../../../../../commons/dto/DonationDTO'

describe('DonationRecordModel', () => {
  let model: DonationRecordModel

  beforeEach(() => {
    model = new DonationRecordModel()
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
    it('should return undefined for any GSI index', () => {
      const gsiIndex = model.getIndex('GSI', 'GSI1')

      expect(gsiIndex).toBeUndefined()
    })

    it('should return undefined for any LSI index', () => {
      const lsiIndex = model.getIndex('LSI', 'LSI1')

      expect(lsiIndex).toBeUndefined()
    })

    it('should return undefined for non-existent index types', () => {
      const result1 = model.getIndex('GSI', 'AnyIndex')
      const result2 = model.getIndex('LSI', 'AnyIndex')

      expect(result1).toBeUndefined()
      expect(result2).toBeUndefined()
    })
  })

  describe('fromDto', () => {
    it('should convert DonationRecordDTO to DonationRecordFields correctly', () => {
      const dto: DonationRecordDTO = {
        donorId: 'donor-123',
        seekerId: 'seeker-456',
        requestPostId: 'request-789',
        requestCreatedAt: '2024-01-01T00:00:00.000Z',
        requestedBloodGroup: 'A+',
        location: 'Dhaka Medical College Hospital',
        donationDateTime: '2024-01-05T10:00:00.000Z',
        createdAt: '2024-01-02T00:00:00.000Z'
      }

      const fields = model.fromDto(dto)

      expect(fields.PK).toBe(`${DONATION_RECORD_PK_PREFIX}#donor-123`)
      expect(fields.SK).toBe(`${DONATION_RECORD_PK_PREFIX}#request-789`)
      expect(fields.seekerId).toBe('seeker-456')
      expect(fields.requestCreatedAt).toBe('2024-01-01T00:00:00.000Z')
      expect(fields.requestedBloodGroup).toBe('A+')
      expect(fields.location).toBe('Dhaka Medical College Hospital')
      expect(fields.donationDateTime).toBe('2024-01-05T10:00:00.000Z')
      expect(fields.createdAt).toBe('2024-01-02T00:00:00.000Z')
      expect(fields).not.toHaveProperty('donorId')
      expect(fields).not.toHaveProperty('requestPostId')
    })

    it('should generate createdAt timestamp when not provided', () => {
      const beforeTime = new Date().toISOString()

      const dto: DonationRecordDTO = {
        donorId: 'donor-123',
        seekerId: 'seeker-456',
        requestPostId: 'request-789',
        requestCreatedAt: '2024-01-01T00:00:00.000Z',
        requestedBloodGroup: 'A+',
        location: 'Dhaka Medical',
        donationDateTime: '2024-01-05T10:00:00.000Z'
      }

      const fields = model.fromDto(dto)

      const afterTime = new Date().toISOString()

      expect(fields.createdAt).toBeDefined()
      expect(fields.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      expect(fields.createdAt! >= beforeTime).toBe(true)
      expect(fields.createdAt! <= afterTime).toBe(true)
    })

    it('should preserve provided createdAt when supplied', () => {
      const specificTimestamp = '2024-06-15T14:30:00.000Z'

      const dto: DonationRecordDTO = {
        donorId: 'donor-123',
        seekerId: 'seeker-456',
        requestPostId: 'request-789',
        requestCreatedAt: '2024-01-01T00:00:00.000Z',
        requestedBloodGroup: 'B-',
        location: 'City Hospital',
        donationDateTime: '2024-01-05T10:00:00.000Z',
        createdAt: specificTimestamp
      }

      const fields = model.fromDto(dto)

      expect(fields.createdAt).toBe(specificTimestamp)
    })

    it('should handle different blood groups', () => {
      const bloodGroups: Array<DonationRecordDTO['requestedBloodGroup']> = [
        'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
      ]

      bloodGroups.forEach((bloodGroup) => {
        const dto: DonationRecordDTO = {
          donorId: 'donor-123',
          seekerId: 'seeker-456',
          requestPostId: 'request-789',
          requestCreatedAt: '2024-01-01T00:00:00.000Z',
          requestedBloodGroup: bloodGroup,
          location: 'Hospital',
          donationDateTime: '2024-01-05T10:00:00.000Z',
          createdAt: '2024-01-02T00:00:00.000Z'
        }

        const fields = model.fromDto(dto)

        expect(fields.requestedBloodGroup).toBe(bloodGroup)
      })
    })

    it('should handle complex IDs with special characters', () => {
      const dto: DonationRecordDTO = {
        donorId: 'donor-id-with-dashes-123',
        seekerId: 'seeker_id_with_underscores_456',
        requestPostId: 'request-post-id-789',
        requestCreatedAt: '2024-01-01T00:00:00.000Z',
        requestedBloodGroup: 'O+',
        location: 'Medical Center',
        donationDateTime: '2024-01-05T10:00:00.000Z',
        createdAt: '2024-01-02T00:00:00.000Z'
      }

      const fields = model.fromDto(dto)

      expect(fields.PK).toContain('donor-id-with-dashes-123')
      expect(fields.SK).toContain('request-post-id-789')
      expect(fields.seekerId).toBe('seeker_id_with_underscores_456')
    })

    it('should handle long location names', () => {
      const longLocation = 'National Institute of Cardiovascular Diseases and Hospital, Dhaka, Bangladesh'

      const dto: DonationRecordDTO = {
        donorId: 'donor-123',
        seekerId: 'seeker-456',
        requestPostId: 'request-789',
        requestCreatedAt: '2024-01-01T00:00:00.000Z',
        requestedBloodGroup: 'AB+',
        location: longLocation,
        donationDateTime: '2024-01-05T10:00:00.000Z',
        createdAt: '2024-01-02T00:00:00.000Z'
      }

      const fields = model.fromDto(dto)

      expect(fields.location).toBe(longLocation)
    })
  })

  describe('toDto', () => {
    it('should convert DonationRecordFields to DonationRecordDTO correctly', () => {
      const fields = {
        PK: `${DONATION_RECORD_PK_PREFIX}#donor-123` as const,
        SK: `${DONATION_RECORD_PK_PREFIX}#request-789` as const,
        seekerId: 'seeker-456',
        requestCreatedAt: '2024-01-01T00:00:00.000Z',
        requestedBloodGroup: 'A+' as const,
        location: 'Dhaka Medical College Hospital',
        donationDateTime: '2024-01-05T10:00:00.000Z',
        createdAt: '2024-01-02T00:00:00.000Z'
      }

      const dto = model.toDto(fields)

      expect(dto.donorId).toBe('donor-123')
      expect(dto.requestPostId).toBe('request-789')
      expect(dto.seekerId).toBe('seeker-456')
      expect(dto.requestCreatedAt).toBe('2024-01-01T00:00:00.000Z')
      expect(dto.requestedBloodGroup).toBe('A+')
      expect(dto.location).toBe('Dhaka Medical College Hospital')
      expect(dto.donationDateTime).toBe('2024-01-05T10:00:00.000Z')
      expect(dto.createdAt).toBe('2024-01-02T00:00:00.000Z')
      expect(dto).not.toHaveProperty('PK')
      expect(dto).not.toHaveProperty('SK')
    })

    it('should extract donorId from PK correctly', () => {
      const fields = {
        PK: `${DONATION_RECORD_PK_PREFIX}#complex-donor-id-123` as const,
        SK: `${DONATION_RECORD_PK_PREFIX}#request-123` as const,
        seekerId: 'seeker-123',
        requestCreatedAt: '2024-01-01T00:00:00.000Z',
        requestedBloodGroup: 'B+' as const,
        location: 'Hospital',
        donationDateTime: '2024-01-05T10:00:00.000Z',
        createdAt: '2024-01-02T00:00:00.000Z'
      }

      const dto = model.toDto(fields)

      expect(dto.donorId).toBe('complex-donor-id-123')
    })

    it('should extract requestPostId from SK correctly', () => {
      const fields = {
        PK: `${DONATION_RECORD_PK_PREFIX}#donor-123` as const,
        SK: `${DONATION_RECORD_PK_PREFIX}#complex-request-post-id-789` as const,
        seekerId: 'seeker-123',
        requestCreatedAt: '2024-01-01T00:00:00.000Z',
        requestedBloodGroup: 'O-' as const,
        location: 'Medical Center',
        donationDateTime: '2024-01-05T10:00:00.000Z',
        createdAt: '2024-01-02T00:00:00.000Z'
      }

      const dto = model.toDto(fields)

      expect(dto.requestPostId).toBe('complex-request-post-id-789')
    })

    it('should handle all blood groups correctly', () => {
      const bloodGroups: Array<DonationRecordDTO['requestedBloodGroup']> = [
        'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
      ]

      bloodGroups.forEach((bloodGroup) => {
        const fields = {
          PK: `${DONATION_RECORD_PK_PREFIX}#donor-123` as const,
          SK: `${DONATION_RECORD_PK_PREFIX}#request-789` as const,
          seekerId: 'seeker-456',
          requestCreatedAt: '2024-01-01T00:00:00.000Z',
          requestedBloodGroup: bloodGroup,
          location: 'Hospital',
          donationDateTime: '2024-01-05T10:00:00.000Z',
          createdAt: '2024-01-02T00:00:00.000Z'
        }

        const dto = model.toDto(fields)

        expect(dto.requestedBloodGroup).toBe(bloodGroup)
      })
    })

    it('should preserve createdAt timestamp', () => {
      const specificTimestamp = '2024-06-15T14:30:45.123Z'

      const fields = {
        PK: `${DONATION_RECORD_PK_PREFIX}#donor-123` as const,
        SK: `${DONATION_RECORD_PK_PREFIX}#request-789` as const,
        seekerId: 'seeker-456',
        requestCreatedAt: '2024-01-01T00:00:00.000Z',
        requestedBloodGroup: 'A+' as const,
        location: 'Hospital',
        donationDateTime: '2024-01-05T10:00:00.000Z',
        createdAt: specificTimestamp
      }

      const dto = model.toDto(fields)

      expect(dto.createdAt).toBe(specificTimestamp)
    })

    it('should handle long location strings', () => {
      const longLocation = 'National Institute of Cardiovascular Diseases and Hospital, Sher-e-Bangla Nagar, Dhaka-1207, Bangladesh'

      const fields = {
        PK: `${DONATION_RECORD_PK_PREFIX}#donor-123` as const,
        SK: `${DONATION_RECORD_PK_PREFIX}#request-789` as const,
        seekerId: 'seeker-456',
        requestCreatedAt: '2024-01-01T00:00:00.000Z',
        requestedBloodGroup: 'AB-' as const,
        location: longLocation,
        donationDateTime: '2024-01-05T10:00:00.000Z',
        createdAt: '2024-01-02T00:00:00.000Z'
      }

      const dto = model.toDto(fields)

      expect(dto.location).toBe(longLocation)
    })

    it('should handle IDs with special characters and multiple hyphens', () => {
      const fields = {
        PK: `${DONATION_RECORD_PK_PREFIX}#donor-with-multiple-hyphens-123` as const,
        SK: `${DONATION_RECORD_PK_PREFIX}#request-also-with-hyphens-789` as const,
        seekerId: 'seeker_with_underscores_456',
        requestCreatedAt: '2024-01-01T00:00:00.000Z',
        requestedBloodGroup: 'O+' as const,
        location: 'Hospital',
        donationDateTime: '2024-01-05T10:00:00.000Z',
        createdAt: '2024-01-02T00:00:00.000Z'
      }

      const dto = model.toDto(fields)

      expect(dto.donorId).toBe('donor-with-multiple-hyphens-123')
      expect(dto.requestPostId).toBe('request-also-with-hyphens-789')
      expect(dto.seekerId).toBe('seeker_with_underscores_456')
    })
  })

  describe('roundtrip conversion', () => {
    it('should maintain data integrity through fromDto and toDto', () => {
      const originalDto: DonationRecordDTO = {
        donorId: 'donor-123',
        seekerId: 'seeker-456',
        requestPostId: 'request-789',
        requestCreatedAt: '2024-01-01T00:00:00.000Z',
        requestedBloodGroup: 'A+',
        location: 'Dhaka Medical College Hospital',
        donationDateTime: '2024-01-05T10:00:00.000Z',
        createdAt: '2024-01-02T00:00:00.000Z'
      }

      const fields = model.fromDto(originalDto)
      const convertedDto = model.toDto(fields)

      expect(convertedDto).toEqual(originalDto)
    })

    it('should handle multiple roundtrip conversions', () => {
      const originalDto: DonationRecordDTO = {
        donorId: 'donor-abc',
        seekerId: 'seeker-xyz',
        requestPostId: 'request-qwe',
        requestCreatedAt: '2024-03-15T08:30:00.000Z',
        requestedBloodGroup: 'B-',
        location: 'City General Hospital',
        donationDateTime: '2024-03-20T14:00:00.000Z',
        createdAt: '2024-03-16T09:00:00.000Z'
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

    it('should handle complex donation record with all fields in roundtrip', () => {
      const originalDto: DonationRecordDTO = {
        donorId: 'complex-donor-id-with-dashes-123',
        seekerId: 'complex-seeker-id_with_underscores_456',
        requestPostId: 'complex-request-post-id-789',
        requestCreatedAt: '2024-06-15T14:30:45.123Z',
        requestedBloodGroup: 'AB+',
        location: 'National Institute of Cardiovascular Diseases and Hospital, Dhaka',
        donationDateTime: '2024-06-20T10:00:00.000Z',
        createdAt: '2024-06-16T08:15:30.456Z'
      }

      const fields = model.fromDto(originalDto)
      const convertedDto = model.toDto(fields)

      expect(convertedDto).toEqual(originalDto)
    })

    it('should handle roundtrip for each blood group', () => {
      const bloodGroups: Array<DonationRecordDTO['requestedBloodGroup']> = [
        'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
      ]

      bloodGroups.forEach((bloodGroup) => {
        const originalDto: DonationRecordDTO = {
          donorId: 'donor-123',
          seekerId: 'seeker-456',
          requestPostId: 'request-789',
          requestCreatedAt: '2024-01-01T00:00:00.000Z',
          requestedBloodGroup: bloodGroup,
          location: 'Hospital',
          donationDateTime: '2024-01-05T10:00:00.000Z',
          createdAt: '2024-01-02T00:00:00.000Z'
        }

        const fields = model.fromDto(originalDto)
        const convertedDto = model.toDto(fields)

        expect(convertedDto).toEqual(originalDto)
      })
    })

    it('should maintain data integrity when createdAt is not provided initially', () => {
      const dtoWithoutCreatedAt: DonationRecordDTO = {
        donorId: 'donor-123',
        seekerId: 'seeker-456',
        requestPostId: 'request-789',
        requestCreatedAt: '2024-01-01T00:00:00.000Z',
        requestedBloodGroup: 'O+',
        location: 'Hospital',
        donationDateTime: '2024-01-05T10:00:00.000Z'
      }

      const fields = model.fromDto(dtoWithoutCreatedAt)
      const convertedDto = model.toDto(fields)

      // Should have generated createdAt
      expect(convertedDto.createdAt).toBeDefined()
      expect(convertedDto.donorId).toBe(dtoWithoutCreatedAt.donorId)
      expect(convertedDto.seekerId).toBe(dtoWithoutCreatedAt.seekerId)
      expect(convertedDto.requestPostId).toBe(dtoWithoutCreatedAt.requestPostId)
      expect(convertedDto.requestCreatedAt).toBe(dtoWithoutCreatedAt.requestCreatedAt)
      expect(convertedDto.requestedBloodGroup).toBe(dtoWithoutCreatedAt.requestedBloodGroup)
      expect(convertedDto.location).toBe(dtoWithoutCreatedAt.location)
      expect(convertedDto.donationDateTime).toBe(dtoWithoutCreatedAt.donationDateTime)
    })
  })
})
