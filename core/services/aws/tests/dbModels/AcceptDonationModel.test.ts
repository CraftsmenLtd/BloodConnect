import {
  AcceptDonationRequestModel,
  ACCEPTED_DONATION_PK_PREFIX,
  ACCEPTED_DONATION_SK_PREFIX
} from '../../commons/ddbModels/AcceptDonationModel'
import type { AcceptDonationDTO } from '../../../../../commons/dto/DonationDTO'

describe('AcceptDonationRequestModel', () => {
  let model: AcceptDonationRequestModel

  beforeEach(() => {
    model = new AcceptDonationRequestModel()
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
    it('should convert AcceptDonationDTO to AcceptDonationFields correctly', () => {
      const dto: AcceptDonationDTO = {
        seekerId: 'test-seeker-id',
        requestPostId: 'test-request-post-id',
        donorId: 'test-donor-id',
        status: 'ACCEPTED',
        createdAt: '2024-01-01T00:00:00.000Z'
      }

      const fields = model.fromDto(dto)

      expect(fields.PK).toBe(`${ACCEPTED_DONATION_PK_PREFIX}#test-seeker-id`)
      expect(fields.SK).toBe(
        `${ACCEPTED_DONATION_SK_PREFIX}#test-request-post-id#test-donor-id`
      )
      expect(fields.status).toBe('ACCEPTED')
      expect(fields.createdAt).toBe('2024-01-01T00:00:00.000Z')
      expect(fields).not.toHaveProperty('seekerId')
      expect(fields).not.toHaveProperty('requestPostId')
      expect(fields).not.toHaveProperty('donorId')
    })

    it('should handle REJECTED status', () => {
      const dto: AcceptDonationDTO = {
        seekerId: 'test-seeker-id',
        requestPostId: 'test-request-post-id',
        donorId: 'test-donor-id',
        status: 'REJECTED',
        createdAt: '2024-01-01T00:00:00.000Z'
      }

      const fields = model.fromDto(dto)

      expect(fields.status).toBe('REJECTED')
    })

    it('should preserve additional DTO fields', () => {
      const dto: AcceptDonationDTO = {
        seekerId: 'test-seeker-id',
        requestPostId: 'test-request-post-id',
        donorId: 'test-donor-id',
        status: 'ACCEPTED',
        createdAt: '2024-01-01T00:00:00.000Z',
        responseMessage: 'I am available to donate',
        respondedAt: '2024-01-01T01:00:00.000Z'
      }

      const fields = model.fromDto(dto)

      expect(fields.responseMessage).toBe('I am available to donate')
      expect(fields.respondedAt).toBe('2024-01-01T01:00:00.000Z')
    })

    it('should handle complex IDs with special characters', () => {
      const dto: AcceptDonationDTO = {
        seekerId: 'seeker-id-with-dashes-123',
        requestPostId: 'request-post-id-with-underscores_456',
        donorId: 'donor-id-with-mixed_chars-789',
        status: 'ACCEPTED',
        createdAt: '2024-01-01T00:00:00.000Z'
      }

      const fields = model.fromDto(dto)

      expect(fields.PK).toContain('seeker-id-with-dashes-123')
      expect(fields.SK).toContain('request-post-id-with-underscores_456')
      expect(fields.SK).toContain('donor-id-with-mixed_chars-789')
    })
  })

  describe('toDto', () => {
    it('should convert AcceptDonationFields to AcceptDonationDTO correctly', () => {
      const fields = {
        PK: `${ACCEPTED_DONATION_PK_PREFIX}#test-seeker-id` as const,
        SK: `${ACCEPTED_DONATION_SK_PREFIX}#test-request-post-id#test-donor-id` as const,
        status: 'ACCEPTED' as const,
        createdAt: '2024-01-01T00:00:00.000Z'
      }

      const dto = model.toDto(fields)

      expect(dto.seekerId).toBe('test-seeker-id')
      expect(dto.requestPostId).toBe('test-request-post-id')
      expect(dto.donorId).toBe('test-donor-id')
      expect(dto.status).toBe('ACCEPTED')
      expect(dto.createdAt).toBe('2024-01-01T00:00:00.000Z')
      expect(dto).not.toHaveProperty('PK')
      expect(dto).not.toHaveProperty('SK')
    })

    it('should extract seekerId from PK correctly', () => {
      const fields = {
        PK: `${ACCEPTED_DONATION_PK_PREFIX}#complex-seeker-id-123` as const,
        SK: `${ACCEPTED_DONATION_SK_PREFIX}#request#donor` as const,
        status: 'ACCEPTED' as const,
        createdAt: '2024-01-01T00:00:00.000Z'
      }

      const dto = model.toDto(fields)

      expect(dto.seekerId).toBe('complex-seeker-id-123')
    })

    it('should extract requestPostId from SK correctly', () => {
      const fields = {
        PK: `${ACCEPTED_DONATION_PK_PREFIX}#seeker` as const,
        SK: `${ACCEPTED_DONATION_SK_PREFIX}#complex-request-post-id-456#donor` as const,
        status: 'ACCEPTED' as const,
        createdAt: '2024-01-01T00:00:00.000Z'
      }

      const dto = model.toDto(fields)

      expect(dto.requestPostId).toBe('complex-request-post-id-456')
    })

    it('should extract donorId from SK correctly', () => {
      const fields = {
        PK: `${ACCEPTED_DONATION_PK_PREFIX}#seeker` as const,
        SK: `${ACCEPTED_DONATION_SK_PREFIX}#request#complex-donor-id-789` as const,
        status: 'ACCEPTED' as const,
        createdAt: '2024-01-01T00:00:00.000Z'
      }

      const dto = model.toDto(fields)

      expect(dto.donorId).toBe('complex-donor-id-789')
    })

    it('should preserve additional fields', () => {
      const fields = {
        PK: `${ACCEPTED_DONATION_PK_PREFIX}#seeker` as const,
        SK: `${ACCEPTED_DONATION_SK_PREFIX}#request#donor` as const,
        status: 'REJECTED' as const,
        createdAt: '2024-01-01T00:00:00.000Z',
        responseMessage: 'Not available',
        respondedAt: '2024-01-01T01:00:00.000Z',
        rejectionReason: 'Out of town'
      }

      const dto = model.toDto(fields)

      expect(dto.responseMessage).toBe('Not available')
      expect(dto.respondedAt).toBe('2024-01-01T01:00:00.000Z')
      expect(dto.rejectionReason).toBe('Out of town')
    })

    it('should handle IDs with hash symbols in SK parsing', () => {
      const fields = {
        PK: `${ACCEPTED_DONATION_PK_PREFIX}#seeker-id` as const,
        SK: `${ACCEPTED_DONATION_SK_PREFIX}#request-with#hash#donor-with#hash` as const,
        status: 'ACCEPTED' as const,
        createdAt: '2024-01-01T00:00:00.000Z'
      }

      const dto = model.toDto(fields)

      // Note: Current implementation splits on all # symbols
      // So IDs containing # will be truncated at the first # within the ID
      expect(dto.requestPostId).toBe('request-with')
      expect(dto.donorId).toBe('hash')
    })
  })

  describe('roundtrip conversion', () => {
    it('should maintain data integrity through fromDto and toDto', () => {
      const originalDto: AcceptDonationDTO = {
        seekerId: 'test-seeker-id',
        requestPostId: 'test-request-post-id',
        donorId: 'test-donor-id',
        status: 'ACCEPTED',
        createdAt: '2024-01-01T00:00:00.000Z',
        responseMessage: 'Happy to help',
        respondedAt: '2024-01-01T01:00:00.000Z'
      }

      const fields = model.fromDto(originalDto)
      const convertedDto = model.toDto(fields)

      expect(convertedDto).toEqual(originalDto)
    })

    it('should handle multiple roundtrip conversions', () => {
      const originalDto: AcceptDonationDTO = {
        seekerId: 'seeker-123',
        requestPostId: 'request-456',
        donorId: 'donor-789',
        status: 'REJECTED',
        createdAt: '2024-12-31T23:59:59.999Z'
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
  })
})
