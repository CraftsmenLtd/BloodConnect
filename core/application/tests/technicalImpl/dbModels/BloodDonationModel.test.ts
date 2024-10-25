import { BloodDonationModel, BLOOD_REQUEST_PK_PREFIX, BLOOD_REQUEST_LSISK_PREFIX, DonationFields } from '../../../technicalImpl/dbModels/BloodDonationModel'
import { DonationStatus } from '../../../../../commons/dto/DonationDTO'
import { donationDto, donationFields } from '../../mocks/mockDonationRequestData'

describe('BloodDonationModel', () => {
  const bloodDonationModel = new BloodDonationModel()
  const mockCreatedAt = '2024-10-10T00:00:00Z'

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
  })

  describe('getPrimaryIndex', () => {
    it('should return the correct primary index', () => {
      const result = bloodDonationModel.getPrimaryIndex()
      expect(result).toEqual({ partitionKey: 'PK', sortKey: 'SK' })
    })
  })

  describe('getIndex', () => {
    it('should return undefined for an unknown index', () => {
      const result = bloodDonationModel.getIndex('GSI', 'unknownIndex')
      expect(result).toBeUndefined()
    })
  })
})
