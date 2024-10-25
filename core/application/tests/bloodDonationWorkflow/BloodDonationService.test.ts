import { BloodDonationService } from '../../bloodDonationWorkflow/BloodDonationService'
import { DonationDTO, DonationStatus } from '../../../../commons/dto/DonationDTO'
import Repository from '../../technicalImpl/policies/repositories/Repository'
import { generateUniqueID } from '../../utils/idGenerator'
import { generateGeohash } from '../../utils/geohash'
import { validateInputWithRules } from '../../utils/validator'
import BloodDonationOperationError from '../../bloodDonationWorkflow/BloodDonationOperationError'
import ThrottlingError from '../../bloodDonationWorkflow/ThrottlingError'
import { donationAttributes, donationDto } from '../mocks/mockDonationRequestData'
import { mockRepository } from '../mocks/mockRepositories'
import { BloodDonationModel, BLOOD_REQUEST_PK_PREFIX } from '../../technicalImpl/dbModels/BloodDonationModel'
import { GENERIC_CODES } from '../../../../commons/libs/constants/GenericCodes'

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
  const bloodDonationRepository = mockRepository as jest.Mocked<Repository<DonationDTO>>
  const mockModel = new BloodDonationModel()
  const mockCreatedAt = '2024-01-01T00:00:00Z'

  beforeEach(() => {
    jest.clearAllMocks();
    (generateUniqueID as jest.Mock).mockReturnValue('uniqueID');
    (generateGeohash as jest.Mock).mockReturnValue('geohash123');
    (validateInputWithRules as jest.Mock).mockReturnValue(null)
    bloodDonationRepository.query.mockResolvedValue({ items: [], lastEvaluatedKey: undefined })
    jest.spyOn(mockModel, 'getPrimaryIndex').mockReturnValue({ partitionKey: 'PK', sortKey: 'SK' })
  })

  describe('createBloodDonation', () => {
    test('should create a blood donation and return success message', async() => {
      const result = await bloodDonationService.createBloodDonation(
        donationAttributes,
        bloodDonationRepository,
        mockModel
      )

      expect(bloodDonationRepository.query).toHaveBeenCalledWith(expect.objectContaining({
        partitionKeyCondition: expect.any(Object),
        sortKeyCondition: expect.any(Object)
      }))
      expect(mockModel.getPrimaryIndex).toHaveBeenCalled()
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

    test('should throw ThrottlingError when daily limit is reached', async() => {
      bloodDonationRepository.query.mockImplementation(() => {
        throw new ThrottlingError(
          'Daily limit (10) reached. Resets at midnight.',
          GENERIC_CODES.TOO_MANY_REQUESTS
        )
      })

      await expect(
        bloodDonationService.createBloodDonation(donationAttributes, bloodDonationRepository, mockModel)
      ).rejects.toThrow(ThrottlingError)

      await expect(
        bloodDonationService.createBloodDonation(donationAttributes, bloodDonationRepository, mockModel)
      ).rejects.toThrow(/Daily limit \(10\) reached/)

      expect(bloodDonationRepository.create).not.toHaveBeenCalled()
    })

    test('should return validation error if input is invalid', async() => {
      (validateInputWithRules as jest.Mock).mockReturnValue('Validation error')

      const result = await bloodDonationService.createBloodDonation(
        donationAttributes,
        bloodDonationRepository,
        mockModel
      )

      expect(validateInputWithRules).toHaveBeenCalledWith(
        {
          bloodQuantity: donationAttributes.bloodQuantity,
          donationDateTime: donationAttributes.donationDateTime
        },
        expect.any(Object)
      )
      expect(result).toBe('Validation error')
      expect(bloodDonationRepository.create).not.toHaveBeenCalled()
    })

    test('should throw BloodDonationOperationError when repository create fails', async() => {
      bloodDonationRepository.create.mockRejectedValue(new Error('Repository error'))

      await expect(
        bloodDonationService.createBloodDonation(donationAttributes, bloodDonationRepository, mockModel)
      ).rejects.toThrow(BloodDonationOperationError)

      await expect(
        bloodDonationService.createBloodDonation(donationAttributes, bloodDonationRepository, mockModel)
      ).rejects.toThrow(/Failed to submit blood donation request/)

      expect(bloodDonationRepository.query).toHaveBeenCalled()
      expect(bloodDonationRepository.create).toHaveBeenCalled()
    })

    test('should throw BloodDonationOperationError when query fails (non-throttling error)', async() => {
      bloodDonationRepository.query.mockRejectedValue(new Error('Database error'))

      await expect(
        bloodDonationService.createBloodDonation(donationAttributes, bloodDonationRepository, mockModel)
      ).rejects.toThrow(BloodDonationOperationError)

      await expect(
        bloodDonationService.createBloodDonation(donationAttributes, bloodDonationRepository, mockModel)
      ).rejects.toThrow(/Failed to check request limits/)

      expect(bloodDonationRepository.create).not.toHaveBeenCalled()
    })
  })

  describe('updateBloodDonation', () => {
    test('should update blood donation if request exists and not completed', async() => {
      const existingDonation: DonationDTO = {
        ...donationDto,
        id: 'req123',
        status: DonationStatus.PENDING,
        createdAt: mockCreatedAt
      }

      bloodDonationRepository.getItem.mockResolvedValue(existingDonation)

      const donationAttributes = {
        seekerId: 'user123',
        requestPostId: 'req123',
        createdAt: mockCreatedAt,
        donationDateTime: new Date().toISOString(),
        bloodQuantity: 3
      }

      const result = await bloodDonationService.updateBloodDonation(donationAttributes, bloodDonationRepository)

      expect(bloodDonationRepository.getItem).toHaveBeenCalledWith(
        `${BLOOD_REQUEST_PK_PREFIX}#user123`,
        `${BLOOD_REQUEST_PK_PREFIX}#${mockCreatedAt}#req123`
      )
      expect(bloodDonationRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'req123',
          createdAt: mockCreatedAt,
          donationDateTime: expect.any(String),
          bloodQuantity: 3
        })
      )
      expect(result).toBe('We have updated your request and will let you know once there is an update.')
    })

    test('should return "Item not found." if the blood donation request does not exist', async() => {
      bloodDonationRepository.getItem.mockResolvedValue(null)

      const donationAttributes = {
        seekerId: 'user123',
        requestPostId: 'req123',
        createdAt: mockCreatedAt
      }

      const result = await bloodDonationService.updateBloodDonation(donationAttributes, bloodDonationRepository)

      expect(bloodDonationRepository.getItem).toHaveBeenCalledWith(
        `${BLOOD_REQUEST_PK_PREFIX}#user123`,
        `${BLOOD_REQUEST_PK_PREFIX}#${mockCreatedAt}#req123`
      )
      expect(result).toBe('Item not found.')
      expect(bloodDonationRepository.update).not.toHaveBeenCalled()
    })

    test('should return error message if blood donation is already completed', async() => {
      const completedDonation: DonationDTO = {
        ...donationDto,
        id: 'req123',
        status: DonationStatus.COMPLETED,
        createdAt: mockCreatedAt
      }

      bloodDonationRepository.getItem.mockResolvedValue(completedDonation)

      const donationAttributes = {
        seekerId: 'user123',
        requestPostId: 'req123',
        createdAt: mockCreatedAt
      }

      const result = await bloodDonationService.updateBloodDonation(donationAttributes, bloodDonationRepository)

      expect(result).toBe('You can\'t update a completed request')
      expect(bloodDonationRepository.update).not.toHaveBeenCalled()
    })

    test('should validate donationDateTime if provided', async() => {
      const existingDonation: DonationDTO = {
        ...donationDto,
        id: 'req123',
        status: DonationStatus.PENDING,
        createdAt: mockCreatedAt
      }

      bloodDonationRepository.getItem.mockResolvedValue(existingDonation);
      (validateInputWithRules as jest.Mock).mockReturnValue('Invalid donation date')

      const donationAttributes = {
        seekerId: 'user123',
        requestPostId: 'req123',
        createdAt: mockCreatedAt,
        donationDateTime: 'invalid-date'
      }

      const result = await bloodDonationService.updateBloodDonation(donationAttributes, bloodDonationRepository)

      expect(result).toBe('Invalid donation date')
      expect(validateInputWithRules).toHaveBeenCalledWith(
        { donationDateTime: 'invalid-date' },
        expect.any(Object)
      )
      expect(bloodDonationRepository.update).not.toHaveBeenCalled()
    })

    test('should throw BloodDonationOperationError when repository update fails', async() => {
      const existingDonation: DonationDTO = {
        ...donationDto,
        id: 'req123',
        status: DonationStatus.PENDING,
        createdAt: mockCreatedAt
      }

      bloodDonationRepository.getItem.mockResolvedValue(existingDonation)
      bloodDonationRepository.update.mockRejectedValue(new Error('Repository update error'))

      const donationAttributes = {
        seekerId: 'user123',
        requestPostId: 'req123',
        createdAt: mockCreatedAt,
        bloodQuantity: 2
      }

      await expect(bloodDonationService.updateBloodDonation(donationAttributes, bloodDonationRepository))
        .rejects.toThrow(BloodDonationOperationError)
      await expect(bloodDonationService.updateBloodDonation(donationAttributes, bloodDonationRepository))
        .rejects.toThrow(/Failed to update blood donation post/)

      expect(bloodDonationRepository.update).toHaveBeenCalled()
    })

    test('should throw BloodDonationOperationError when getItem fails', async() => {
      bloodDonationRepository.getItem.mockRejectedValue(new Error('Database error'))

      const donationAttributes = {
        seekerId: 'user123',
        requestPostId: 'req123',
        createdAt: mockCreatedAt
      }

      await expect(bloodDonationService.updateBloodDonation(donationAttributes, bloodDonationRepository))
        .rejects.toThrow(BloodDonationOperationError)
      await expect(bloodDonationService.updateBloodDonation(donationAttributes, bloodDonationRepository))
        .rejects.toThrow(/Failed to update blood donation post/)

      expect(bloodDonationRepository.update).not.toHaveBeenCalled()
    })
  })
})
