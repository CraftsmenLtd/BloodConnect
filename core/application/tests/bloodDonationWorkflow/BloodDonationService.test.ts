import { BloodDonationService } from '../../bloodDonationWorkflow/BloodDonationService'
import { DonationDTO, DonationStatus } from '../../../../commons/dto/DonationDTO'
import Repository from '../../technicalImpl/policies/repositories/Repository'
import { generateUniqueID } from '../../utils/idGenerator'
import { generateGeohash } from '../../utils/geohash'
import { validateInputWithRules } from '../../utils/validator'
import BloodDonationOperationError from '../../bloodDonationWorkflow/BloodDonationOperationError'
import { donationAttributes } from '../mocks/mockDonationRequestData'
import { mockRepository as importedMockRepository } from '../mocks/mockRepositories'

jest.mock('../../utils/idGenerator', () => ({
  generateUniqueID: jest.fn()
}))

jest.mock('../../utils/geohash', () => ({
  generateGeohash: jest.fn()
}))

jest.mock('../../utils/validator', () => ({
  validateInputWithRules: jest.fn()
}))

describe('BloodDonationService', () => {
  const bloodDonationService = new BloodDonationService()
  const bloodDonationRepository = importedMockRepository as jest.Mocked<Repository<DonationDTO>>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createBloodDonation', () => {
    test('should create a blood donation and return success message', async() => {
      (generateUniqueID as jest.Mock).mockReturnValue('uniqueID');
      (generateGeohash as jest.Mock).mockReturnValue('geohash123');
      (validateInputWithRules as jest.Mock).mockReturnValue(null)

      const result = await bloodDonationService.createBloodDonation(donationAttributes, bloodDonationRepository)

      expect(generateUniqueID).toHaveBeenCalled()
      expect(generateGeohash).toHaveBeenCalledWith(donationAttributes.latitude, donationAttributes.longitude)
      expect(bloodDonationRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        id: 'uniqueID',
        status: DonationStatus.PENDING,
        geohash: 'geohash123',
        donationDateTime: expect.any(String)
      }))
      expect(result).toBe('We have accepted your request, and we will let you know when we find a donor.')
    })

    test('should return validation error if input is invalid', async() => {
      (validateInputWithRules as jest.Mock).mockReturnValue('Validation error')
      const result = await bloodDonationService.createBloodDonation(donationAttributes, bloodDonationRepository)

      expect(validateInputWithRules).toHaveBeenCalled()
      expect(result).toBe('Validation error')
      expect(bloodDonationRepository.create).not.toHaveBeenCalled()
    })

    test('should throw BloodDonationOperationError when repository create fails', async() => {
      (generateUniqueID as jest.Mock).mockReturnValue('uniqueID');
      (generateGeohash as jest.Mock).mockReturnValue('geohash123');
      (validateInputWithRules as jest.Mock).mockReturnValue(null)
      bloodDonationRepository.create.mockRejectedValue(new Error('Repository error'))

      await expect(bloodDonationService.createBloodDonation(donationAttributes, bloodDonationRepository)).rejects.toThrow(BloodDonationOperationError)
      expect(bloodDonationRepository.create).toHaveBeenCalled()
    })
  })

  describe('updateBloodDonation', () => {
    test('should update blood donation if request exists and not completed', async() => {
      (bloodDonationRepository.getItem as jest.Mock).mockResolvedValue({ id: '123', status: DonationStatus.PENDING });
      (validateInputWithRules as jest.Mock).mockReturnValue(null)

      const donationAttributes = {
        seekerId: 'user123',
        requestPostId: 'req123',
        donationDateTime: new Date().toISOString(),
        bloodQuantity: 3
      }

      const result = await bloodDonationService.updateBloodDonation(donationAttributes, bloodDonationRepository)

      expect(bloodDonationRepository.getItem).toHaveBeenCalledWith('BLOOD_REQUEST_PK_PREFIX#user123', 'BLOOD_REQUEST_PK_PREFIX#req123')
      expect(bloodDonationRepository.update).toHaveBeenCalledWith(expect.objectContaining({ id: 'req123', donationDateTime: expect.any(String) }))
      expect(result).toBe('We have updated your request and will let you know once there is an update.')
    })

    test('should return "Item not found." if the blood donation request does not exist', async() => {
      (bloodDonationRepository.getItem as jest.Mock).mockResolvedValue(null)

      const donationAttributes = {
        seekerId: 'user123',
        requestPostId: 'req123'
      }

      const result = await bloodDonationService.updateBloodDonation(donationAttributes, bloodDonationRepository)

      expect(result).toBe('Item not found.')
      expect(bloodDonationRepository.update).not.toHaveBeenCalled()
    })

    test('should return error message if blood donation is already completed', async() => {
      (bloodDonationRepository.getItem as jest.Mock).mockResolvedValue({ id: '123', status: DonationStatus.COMPLETED })

      const donationAttributes = {
        seekerId: 'user123',
        requestPostId: 'req123'
      }

      const result = await bloodDonationService.updateBloodDonation(donationAttributes, bloodDonationRepository)

      expect(result).toBe('You can\'t update a completed request')
      expect(bloodDonationRepository.update).not.toHaveBeenCalled()
    })

    test('should throw BloodDonationOperationError when repository update fails', async() => {
      (bloodDonationRepository.getItem as jest.Mock).mockResolvedValue({ id: '123', status: DonationStatus.PENDING });
      (validateInputWithRules as jest.Mock).mockReturnValue(null)
      bloodDonationRepository.update.mockRejectedValue(new Error('Repository update error'))

      const donationAttributes = {
        seekerId: 'user123',
        requestPostId: 'req123',
        bloodQuantity: 2
      }

      await expect(bloodDonationService.updateBloodDonation(donationAttributes, bloodDonationRepository)).rejects.toThrow(BloodDonationOperationError)

      expect(bloodDonationRepository.update).toHaveBeenCalled()
    })
  })
})
