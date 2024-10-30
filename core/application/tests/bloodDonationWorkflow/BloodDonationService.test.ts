import { BloodDonationService } from '../../bloodDonationWorkflow/BloodDonationService'
import { DonationDTO, DonationStatus } from '../../../../commons/dto/DonationDTO'
import Repository from '../../technicalImpl/policies/repositories/Repository'
import { generateUniqueID } from '../../utils/idGenerator'
import { generateGeohash } from '../../utils/geohash'
import { validateInputWithRules } from '../../utils/validator'
import BloodDonationOperationError from '../../bloodDonationWorkflow/BloodDonationOperationError'
import { donationAttributesMock, donorRoutingAttributesMock } from '../mocks/mockDonationRequestData'
import { mockRepository as importedMockRepository } from '../mocks/mockRepositories'
import { BLOOD_REQUEST_PK_PREFIX } from '../../technicalImpl/dbModels/BloodDonationModel'
import { StepFunctionModel } from '../../technicalImpl/stepFunctions/StepFunctionModel'

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
  let bloodDonationService: BloodDonationService
  let bloodDonationRepository: jest.Mocked<Repository<DonationDTO>>
  let stepFunctionModel: jest.Mocked<StepFunctionModel>

  beforeEach(() => {
    bloodDonationService = new BloodDonationService()
    bloodDonationRepository = importedMockRepository as jest.Mocked<Repository<DonationDTO>>
    stepFunctionModel = { startExecution: jest.fn() }
    process.env.MAX_RETRY_COUNT = '5'
  })

  afterEach(() => {
    jest.clearAllMocks()
    jest.resetAllMocks()
  })

  describe('createBloodDonation', () => {
    test('should create a blood donation and return success message', async() => {
      (generateUniqueID as jest.Mock).mockReturnValue('uniqueID');
      (generateGeohash as jest.Mock).mockReturnValue('geohash123');
      (validateInputWithRules as jest.Mock).mockReturnValue(null)

      const result = await bloodDonationService.createBloodDonation(donationAttributesMock, bloodDonationRepository)

      expect(generateUniqueID).toHaveBeenCalled()
      expect(generateGeohash).toHaveBeenCalledWith(donationAttributesMock.latitude, donationAttributesMock.longitude)
      expect(bloodDonationRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        id: 'uniqueID',
        status: DonationStatus.PENDING,
        geohash: 'geohash123',
        donationDateTime: expect.any(String)
      }))
      expect(result).toBe('We have accepted your request, and we will let you know when we find a donor.')
    })

    test('should throw BloodDonationOperationError if input is invalid', async() => {
      (validateInputWithRules as jest.Mock).mockReturnValue('Validation error')

      await expect(bloodDonationService.createBloodDonation(donationAttributesMock, bloodDonationRepository))
        .rejects.toThrow(BloodDonationOperationError)

      expect(validateInputWithRules).toHaveBeenCalled()
      expect(bloodDonationRepository.create).not.toHaveBeenCalled()
    })

    test('should throw BloodDonationOperationError when repository create fails', async() => {
      (generateUniqueID as jest.Mock).mockReturnValue('uniqueID');
      (generateGeohash as jest.Mock).mockReturnValue('geohash123');
      (validateInputWithRules as jest.Mock).mockReturnValue(null)
      bloodDonationRepository.create.mockRejectedValue(new Error('Repository error'))

      await expect(bloodDonationService.createBloodDonation(donationAttributesMock, bloodDonationRepository))
        .rejects.toThrow(BloodDonationOperationError)

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

      expect(bloodDonationRepository.getItem).toHaveBeenCalledWith(`${BLOOD_REQUEST_PK_PREFIX}#user123`, `${BLOOD_REQUEST_PK_PREFIX}#req123`)
      expect(bloodDonationRepository.update).toHaveBeenCalledWith(expect.objectContaining({
        id: 'req123',
        donationDateTime: expect.any(String)
      }))
      expect(result).toBe('We have updated your request and will let you know once there is an update.')
    })

    test('should return "Item not found." if the blood donation request does not exist', async() => {
      (bloodDonationRepository.getItem as jest.Mock).mockResolvedValue(null)

      const donationAttributes = {
        seekerId: 'user123',
        requestPostId: 'req123'
      }

      await expect(bloodDonationService.updateBloodDonation(donationAttributes, bloodDonationRepository))
        .rejects.toThrow(BloodDonationOperationError)
      expect(bloodDonationRepository.update).not.toHaveBeenCalled()
    })

    test('should return error message if blood donation is already completed', async() => {
      (bloodDonationRepository.getItem as jest.Mock).mockResolvedValue({ id: '123', status: DonationStatus.COMPLETED })

      const donationAttributes = {
        seekerId: 'user123',
        requestPostId: 'req123'
      }

      await expect(bloodDonationService.updateBloodDonation(donationAttributes, bloodDonationRepository))
        .rejects.toThrow(BloodDonationOperationError)

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

      await expect(bloodDonationService.updateBloodDonation(donationAttributes, bloodDonationRepository))
        .rejects.toThrow(BloodDonationOperationError)

      expect(bloodDonationRepository.update).toHaveBeenCalled()
    })
  })

  describe('routeDonorRequest', () => {
    const mockDonationDTO = {
      id: 'req123',
      seekerId: 'seeker123',
      status: DonationStatus.PENDING,
      patientName: 'John Doe',
      neededBloodGroup: 'O-',
      bloodQuantity: 2,
      urgencyLevel: 'urgent',
      location: 'Baridhara, Dhaka',
      latitude: 23.7936,
      longitude: 90.4043,
      geohash: 'geohash123',
      donationDateTime: '2024-10-20T15:00:00Z',
      contactNumber: '+8801712345678',
      transportationInfo: 'Car available',
      retryCount: 0
    }

    test('should initiate donor search process if retry count is below max and request is not completed or expired', async() => {
      (bloodDonationRepository.getItem as jest.Mock).mockResolvedValue(mockDonationDTO)

      const result = await bloodDonationService.routeDonorRequest(donorRoutingAttributesMock, bloodDonationRepository, stepFunctionModel)

      expect(bloodDonationRepository.getItem).toHaveBeenCalledWith('BLOOD_REQ#seeker123', 'BLOOD_REQ#req123')
      expect(bloodDonationRepository.update).toHaveBeenCalledWith(expect.objectContaining({ ...mockDonationDTO, retryCount: 1 }))
      expect(stepFunctionModel.startExecution).toHaveBeenCalledWith(expect.objectContaining({
        seekerId: mockDonationDTO.seekerId,
        requestPostId: mockDonationDTO.id,
        neededBloodGroup: mockDonationDTO.neededBloodGroup,
        bloodQuantity: mockDonationDTO.bloodQuantity,
        urgencyLevel: mockDonationDTO.urgencyLevel,
        latitude: mockDonationDTO.latitude,
        longitude: mockDonationDTO.longitude
      }))
      expect(result).toBe('We have updated your request and initiated the donor search process.')
    })

    test('should return expiration message if retry count reaches maximum', async() => {
      const expiredMockDonationDTO = { ...mockDonationDTO, retryCount: 5 };
      (bloodDonationRepository.getItem as jest.Mock).mockResolvedValue(expiredMockDonationDTO)

      const result = await bloodDonationService.routeDonorRequest(donorRoutingAttributesMock, bloodDonationRepository, stepFunctionModel)

      expect(result).toBe('The donor search process expired after the maximum retry limit is reached.')
    })

    test('should return "Item not found." if the blood donation request does not exist', async() => {
      (bloodDonationRepository.getItem as jest.Mock).mockResolvedValue(null)

      const result = await bloodDonationService.routeDonorRequest(donorRoutingAttributesMock, bloodDonationRepository, stepFunctionModel)

      expect(result).toBe('Item not found.')
      expect(bloodDonationRepository.update).not.toHaveBeenCalled()
      expect(stepFunctionModel.startExecution).not.toHaveBeenCalled()
    })

    test('should return error message if blood donation is already completed or expired', async() => {
      (bloodDonationRepository.getItem as jest.Mock).mockResolvedValue({ ...mockDonationDTO, status: DonationStatus.COMPLETED })

      const result = await bloodDonationService.routeDonorRequest(donorRoutingAttributesMock, bloodDonationRepository, stepFunctionModel)

      expect(result).toBe('You can\'t update the donation request')
      expect(bloodDonationRepository.update).not.toHaveBeenCalled()
      expect(stepFunctionModel.startExecution).not.toHaveBeenCalled()
    })
    test('should throw BloodDonationOperationError when an error occurs in routeDonorRequest', async() => {
      (bloodDonationRepository.getItem as jest.Mock).mockResolvedValue(mockDonationDTO);
      (bloodDonationRepository.update as jest.Mock).mockResolvedValue(mockDonationDTO);
      (stepFunctionModel.startExecution as jest.Mock).mockRejectedValue(new Error('Step Function error'))

      await expect(
        bloodDonationService.routeDonorRequest(donorRoutingAttributesMock, bloodDonationRepository, stepFunctionModel)
      ).rejects.toThrow(BloodDonationOperationError)

      expect(bloodDonationRepository.getItem).toHaveBeenCalledWith('BLOOD_REQ#seeker123', 'BLOOD_REQ#req123')
      expect(bloodDonationRepository.update).toHaveBeenCalledWith(expect.objectContaining({ id: 'req123', retryCount: 1 }))
      expect(stepFunctionModel.startExecution).toHaveBeenCalled()
    })
  })
})
