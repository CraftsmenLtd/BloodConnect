import { BloodDonationService } from '../../bloodDonationWorkflow/BloodDonationService'
import { DonationDTO, DonationStatus, DonorSearchDTO } from '../../../../commons/dto/DonationDTO'
import Repository from '../../technicalImpl/policies/repositories/Repository'
import { generateUniqueID } from '../../utils/idGenerator'
import { generateGeohash } from '../../utils/geohash'
import { validateInputWithRules } from '../../utils/validator'
import BloodDonationOperationError from '../../bloodDonationWorkflow/BloodDonationOperationError'
import ThrottlingError from '../../bloodDonationWorkflow/ThrottlingError'
import { currentDate, donationAttributesMock, donationDtoMock, donorRoutingAttributesMock, mockDonationDTO } from '../mocks/mockDonationRequestData'
import { mockRepository } from '../mocks/mockRepositories'
import { BloodDonationModel, BLOOD_REQUEST_PK_PREFIX } from '../../technicalImpl/dbModels/BloodDonationModel'
import { QueryConditionOperator } from '../../technicalImpl/policies/repositories/QueryTypes'
import { GENERIC_CODES } from '../../../../commons/libs/constants/GenericCodes'
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
  let donorSearchRepository: jest.Mocked<Repository<DonorSearchDTO>>
  let stepFunctionModel: jest.Mocked<StepFunctionModel>
  const mockModel = new BloodDonationModel()
  const mockCreatedAt = '2024-01-01T00:00:00Z'

  beforeEach(() => {
    jest.clearAllMocks();
    (generateUniqueID as jest.Mock).mockReturnValue('uniqueID');
    (generateGeohash as jest.Mock).mockReturnValue('geohash123');
    (validateInputWithRules as jest.Mock).mockReturnValue(null)
    bloodDonationService = new BloodDonationService()
    bloodDonationRepository = mockRepository as jest.Mocked<Repository<DonationDTO>>
    donorSearchRepository = mockRepository as jest.Mocked<Repository<DonorSearchDTO>>
    stepFunctionModel = { startExecution: jest.fn() }

    bloodDonationRepository.query.mockResolvedValue({ items: [], lastEvaluatedKey: undefined })
    bloodDonationRepository.create.mockResolvedValue(donationDtoMock)
    donorSearchRepository.query.mockResolvedValue({ items: [], lastEvaluatedKey: undefined })
    donorSearchRepository.create.mockResolvedValue(donationDtoMock)
    jest.spyOn(mockModel, 'getPrimaryIndex').mockReturnValue({ partitionKey: 'PK', sortKey: 'SK' })
    process.env.MAX_RETRY_COUNT = '5'
  })

  afterEach(() => {
    jest.clearAllMocks()
    jest.resetAllMocks()
  })

  describe('createBloodDonation', () => {
    test('should create a blood donation and return success message', async() => {
      const result = await bloodDonationService.createBloodDonation(
        donationAttributesMock,
        bloodDonationRepository,
        mockModel
      )

      expect(bloodDonationRepository.query).toHaveBeenCalledWith(expect.objectContaining({
        partitionKeyCondition: expect.any(Object),
        sortKeyCondition: expect.any(Object)
      }))
      expect(mockModel.getPrimaryIndex).toHaveBeenCalled()
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

      await expect(
        bloodDonationService.createBloodDonation(donationAttributesMock, bloodDonationRepository, mockModel)
      ).rejects.toThrow(BloodDonationOperationError)

      expect(validateInputWithRules).toHaveBeenCalledWith(
        {
          bloodQuantity: donationAttributesMock.bloodQuantity,
          donationDateTime: donationAttributesMock.donationDateTime
        },
        expect.any(Object)
      )
      expect(bloodDonationRepository.create).not.toHaveBeenCalled()
    })

    test('should throw BloodDonationOperationError when repository create fails', async() => {
      bloodDonationRepository.create.mockRejectedValue(new Error('Repository error'))

      await expect(
        bloodDonationService.createBloodDonation(donationAttributesMock, bloodDonationRepository, mockModel)
      ).rejects.toThrow(BloodDonationOperationError)

      await expect(
        bloodDonationService.createBloodDonation(donationAttributesMock, bloodDonationRepository, mockModel)
      ).rejects.toThrow(/Failed to submit blood donation request/)

      expect(bloodDonationRepository.query).toHaveBeenCalled()
      expect(bloodDonationRepository.create).toHaveBeenCalled()
    })
  })

  describe('createBloodDonation (throttling tests)', () => {
    beforeEach(() => {
      jest.useFakeTimers()
      jest.setSystemTime(new Date('2024-01-01T10:00:00Z'))
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    test('should allow request when under daily limit', async() => {
      bloodDonationRepository.query.mockResolvedValue({
        items: Array(9).fill(donationDtoMock),
        lastEvaluatedKey: undefined
      })

      const result = await bloodDonationService.createBloodDonation(
        donationAttributesMock,
        bloodDonationRepository,
        mockModel
      )

      expect(result).toBe('We have accepted your request, and we will let you know when we find a donor.')
      expect(bloodDonationRepository.query).toHaveBeenCalledWith({
        partitionKeyCondition: {
          attributeName: 'PK',
          operator: QueryConditionOperator.EQUALS,
          attributeValue: `${BLOOD_REQUEST_PK_PREFIX}#${donationAttributesMock.seekerId}`
        },
        sortKeyCondition: {
          attributeName: 'SK',
          operator: QueryConditionOperator.BEGINS_WITH,
          attributeValue: `${BLOOD_REQUEST_PK_PREFIX}#2024-01-01`
        }
      })
    })

    test('should throw ThrottlingError when daily limit is reached', async() => {
      bloodDonationRepository.query.mockResolvedValue({
        items: Array(10).fill(donationDtoMock),
        lastEvaluatedKey: undefined
      })

      await expect(
        bloodDonationService.createBloodDonation(donationAttributesMock, bloodDonationRepository, mockModel)
      ).rejects.toThrow(ThrottlingError)

      await expect(
        bloodDonationService.createBloodDonation(donationAttributesMock, bloodDonationRepository, mockModel)
      ).rejects.toThrow(/You've reached today's limit of 10 requests/)
    })

    test('should check throttling with correct date prefix', async() => {
      jest.setSystemTime(new Date('2024-03-15T23:59:59Z'))

      await bloodDonationService.createBloodDonation(
        donationAttributesMock,
        bloodDonationRepository,
        mockModel
      )

      expect(bloodDonationRepository.query).toHaveBeenCalledWith(
        expect.objectContaining({
          sortKeyCondition: {
            attributeName: 'SK',
            operator: QueryConditionOperator.BEGINS_WITH,
            attributeValue: `${BLOOD_REQUEST_PK_PREFIX}#2024-03-15`
          }
        })
      )
    })

    test('should handle repository query errors during throttling check', async() => {
      bloodDonationRepository.query.mockRejectedValue(new Error('Database connection error'))

      await expect(
        bloodDonationService.createBloodDonation(donationAttributesMock, bloodDonationRepository, mockModel)
      ).rejects.toThrow(BloodDonationOperationError)

      await expect(
        bloodDonationService.createBloodDonation(donationAttributesMock, bloodDonationRepository, mockModel)
      ).rejects.toThrow(/Failed to check request limits/)
    })
  })

  describe('throttling integration with DynamoDB', () => {
    beforeEach(() => {
      jest.useFakeTimers()
      jest.setSystemTime(new Date('2024-01-01T10:00:00Z'))
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    test('should properly format DynamoDB query for throttling check', async() => {
      await bloodDonationService.createBloodDonation(
        donationAttributesMock,
        bloodDonationRepository,
        mockModel
      )

      expect(bloodDonationRepository.query).toHaveBeenCalledWith({
        partitionKeyCondition: {
          attributeName: 'PK',
          operator: QueryConditionOperator.EQUALS,
          attributeValue: `${BLOOD_REQUEST_PK_PREFIX}#${donationAttributesMock.seekerId}`
        },
        sortKeyCondition: {
          attributeName: 'SK',
          operator: QueryConditionOperator.BEGINS_WITH,
          attributeValue: `${BLOOD_REQUEST_PK_PREFIX}#2024-01-01`
        }
      })
    })

    test('should handle time zones correctly for throttling', async() => {
      jest.setSystemTime(new Date('2024-01-01T19:00:00+05:00'))

      await bloodDonationService.createBloodDonation(
        donationAttributesMock,
        bloodDonationRepository,
        mockModel
      )

      expect(bloodDonationRepository.query).toHaveBeenCalledWith(
        expect.objectContaining({
          sortKeyCondition: expect.objectContaining({
            attributeValue: `${BLOOD_REQUEST_PK_PREFIX}#2024-01-01`
          })
        })
      )
    })
  })

  describe('updateBloodDonation', () => {
    test('should update blood donation if request exists and not completed', async() => {
      const existingDonation: DonationDTO = {
        ...donationDtoMock,
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

    test('should throw BloodDonationOperationError if request does not exist', async() => {
      bloodDonationRepository.getItem.mockResolvedValue(null)

      const donationAttributes = {
        seekerId: 'user123',
        requestPostId: 'req123',
        createdAt: mockCreatedAt
      }

      await expect(bloodDonationService.updateBloodDonation(donationAttributes, bloodDonationRepository))
        .rejects.toThrow(BloodDonationOperationError)
      expect(bloodDonationRepository.update).not.toHaveBeenCalled()
    })

    test('should throw BloodDonationOperationError when validating donationDateTime', async() => {
      const existingDonation: DonationDTO = {
        ...donationDtoMock,
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

      await expect(
        bloodDonationService.updateBloodDonation(donationAttributes, bloodDonationRepository)
      ).rejects.toThrow(BloodDonationOperationError)

      expect(validateInputWithRules).toHaveBeenCalledWith(
        { donationDateTime: 'invalid-date' },
        expect.any(Object)
      )
      expect(bloodDonationRepository.update).not.toHaveBeenCalled()
    })

    test('should throw BloodDonationOperationError if blood donation is already completed', async() => {
      const completedDonation: DonationDTO = {
        ...donationDtoMock,
        id: 'req123',
        status: DonationStatus.COMPLETED,
        createdAt: mockCreatedAt
      }

      bloodDonationRepository.getItem.mockResolvedValue(completedDonation)

      const donationAttributes = {
        seekerId: 'user123',
        requestPostId: 'req123',
        createdAt: mockCreatedAt,
        bloodQuantity: 3
      }

      await expect(bloodDonationService.updateBloodDonation(donationAttributes, bloodDonationRepository)).rejects.toThrow(BloodDonationOperationError)
      expect(bloodDonationRepository.update).not.toHaveBeenCalled()
    })

    test('should throw BloodDonationOperationError when the update operation fails', async() => {
      const existingDonation: DonationDTO = {
        ...donationDtoMock,
        id: 'req123',
        status: DonationStatus.PENDING,
        createdAt: mockCreatedAt
      }

      bloodDonationRepository.getItem.mockResolvedValue(existingDonation)
      bloodDonationRepository.update.mockRejectedValue(new Error('Update failed'))

      const donationAttributes = {
        seekerId: 'user123',
        requestPostId: 'req123',
        createdAt: mockCreatedAt,
        bloodQuantity: 3
      }

      await expect(
        bloodDonationService.updateBloodDonation(donationAttributes, bloodDonationRepository)
      ).rejects.toThrow(BloodDonationOperationError)

      await expect(
        bloodDonationService.updateBloodDonation(donationAttributes, bloodDonationRepository)
      ).rejects.toThrow(/Failed to update blood donation post/)
    })

    test('should throw BloodDonationOperationError directly if it is thrown during update', async() => {
      const existingDonation: DonationDTO = {
        ...donationDtoMock,
        id: 'req123',
        status: DonationStatus.PENDING,
        createdAt: mockCreatedAt
      }

      bloodDonationRepository.getItem.mockResolvedValue(existingDonation)
      bloodDonationRepository.update.mockRejectedValue(
        new BloodDonationOperationError('Operation failed', GENERIC_CODES.ERROR)
      )

      const donationAttributes = {
        seekerId: 'user123',
        requestPostId: 'req123',
        createdAt: mockCreatedAt,
        bloodQuantity: 3
      }

      await expect(
        bloodDonationService.updateBloodDonation(donationAttributes, bloodDonationRepository)
      ).rejects.toThrow(BloodDonationOperationError)

      await expect(
        bloodDonationService.updateBloodDonation(donationAttributes, bloodDonationRepository)
      ).rejects.toThrow(/Operation failed/)
    })
  })

  describe('routeDonorRequest', () => {
    test('should initiate donor search process if retry count is below max and request is not completed or expired', async() => {
      bloodDonationRepository.getItem.mockResolvedValue(mockDonationDTO)

      const result = await bloodDonationService.routeDonorRequest(
        donorRoutingAttributesMock,
        bloodDonationRepository,
        stepFunctionModel,
        donorSearchRepository
      )

      expect(bloodDonationRepository.getItem).toHaveBeenCalledWith(
        'BLOOD_REQ#seeker123',
        `BLOOD_REQ#${currentDate}#req123`
      )
      expect(bloodDonationRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockDonationDTO,
          retryCount: 1
        })
      )
      expect(stepFunctionModel.startExecution).toHaveBeenCalledWith(expect.objectContaining({
        seekerId: mockDonationDTO.seekerId,
        requestPostId: mockDonationDTO.id,
        createdAt: mockDonationDTO.createdAt,
        donationDateTime: mockDonationDTO.donationDateTime,
        neededBloodGroup: mockDonationDTO.neededBloodGroup,
        bloodQuantity: mockDonationDTO.bloodQuantity,
        urgencyLevel: mockDonationDTO.urgencyLevel,
        geohash: mockDonationDTO.geohash,
        retryCount: 1,
        city: 'Dhaka'
      }), expect.any(String))
      expect(result).toBe('We have updated your request and initiated the donor search process.')
    })

    test('should return expiration message if retry count reaches maximum', async() => {
      const expiredMockDonationDTO: DonationDTO = {
        ...mockDonationDTO,
        retryCount: 5
      }
      bloodDonationRepository.getItem.mockResolvedValue(expiredMockDonationDTO)
      donorSearchRepository.getItem.mockResolvedValue(expiredMockDonationDTO)

      const result = await bloodDonationService.routeDonorRequest(
        donorRoutingAttributesMock,
        bloodDonationRepository,
        stepFunctionModel,
        donorSearchRepository
      )

      expect(result).toBe('The donor search process expired after the maximum retry limit is reached.')
      expect(bloodDonationRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          ...expiredMockDonationDTO,
          retryCount: 6
        })
      )
    })

    test('should return "Item not found." if the blood donation request does not exist', async() => {
      bloodDonationRepository.getItem.mockResolvedValue(null)

      const result = await bloodDonationService.routeDonorRequest(
        donorRoutingAttributesMock,
        bloodDonationRepository,
        stepFunctionModel,
        donorSearchRepository
      )

      expect(result).toBe('Item not found.')
      expect(bloodDonationRepository.update).not.toHaveBeenCalled()
      expect(stepFunctionModel.startExecution).not.toHaveBeenCalled()
    })

    test('should return error message if blood donation is already completed or expired', async() => {
      bloodDonationRepository.getItem.mockResolvedValue({
        ...mockDonationDTO,
        status: DonationStatus.COMPLETED
      })

      const result = await bloodDonationService.routeDonorRequest(
        donorRoutingAttributesMock,
        bloodDonationRepository,
        stepFunctionModel,
        donorSearchRepository
      )

      expect(result).toBe('You can\'t update the donation request')
      expect(bloodDonationRepository.update).not.toHaveBeenCalled()
      expect(stepFunctionModel.startExecution).not.toHaveBeenCalled()
    })

    test('should throw BloodDonationOperationError when an error occurs in routeDonorRequest', async() => {
      bloodDonationRepository.getItem.mockResolvedValue(mockDonationDTO)
      bloodDonationRepository.update.mockResolvedValue(mockDonationDTO)
      donorSearchRepository.getItem.mockResolvedValue(mockDonationDTO)
      donorSearchRepository.update.mockResolvedValue(mockDonationDTO)
      stepFunctionModel.startExecution.mockRejectedValue(new Error('Step Function error'))

      await expect(
        bloodDonationService.routeDonorRequest(
          donorRoutingAttributesMock,
          bloodDonationRepository,
          stepFunctionModel,
          donorSearchRepository
        )
      ).rejects.toThrow(BloodDonationOperationError)

      expect(bloodDonationRepository.getItem).toHaveBeenCalledWith(
        'BLOOD_REQ#seeker123',
        `BLOOD_REQ#${currentDate}#req123`
      )
      expect(bloodDonationRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'req123',
          retryCount: 1
        })
      )
      expect(stepFunctionModel.startExecution).toHaveBeenCalled()
    })
  })
})
