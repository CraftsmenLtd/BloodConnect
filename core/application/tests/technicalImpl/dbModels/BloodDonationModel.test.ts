import { BloodDonationModel, BLOOD_REQUEST_LSISK_PREFIX } from '../../../technicalImpl/dbModels/BloodDonationModel'
import { DonationStatus } from '../../../../../commons/dto/DonationDTO'
import { donationDto, donationFields } from '../../mocks/mockDonationRequestData'

describe('BloodDonationModel', () => {
  const bloodDonationModel = new BloodDonationModel()

  describe('fromDto', () => {
    it('should correctly convert DonationDTO to DonationFields', () => {
      const result = bloodDonationModel.fromDto(donationDto)
      expect(result).toEqual({ ...donationFields, createdAt: expect.any(String) })
    })
  })

  describe('toDto', () => {
    it('should correctly convert DonationFields to DonationDTO', () => {
      const result = bloodDonationModel.toDto({ ...donationFields, createdAt: '2024-10-10T00:00:00Z' })
      expect(result).toEqual({
        ...donationDto,
        id: 'req123',
        seekerId: 'user456',
        LSI1SK: `${BLOOD_REQUEST_LSISK_PREFIX}#${DonationStatus.PENDING}#req123`
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
