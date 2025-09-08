import { BloodDonationService } from '../../bloodDonationWorkflow/BloodDonationService'
import type { DonationDTO } from '../../../../commons/dto/DonationDTO'
import { DonationStatus } from '../../../../commons/dto/DonationDTO'
import { generateUniqueID } from '../../utils/idGenerator'
import { generateGeohash } from '../../utils/geohash'
import { validateInputWithRules } from '../../utils/validator'
import BloodDonationOperationError from '../../bloodDonationWorkflow/BloodDonationOperationError'
import ThrottlingError from '../../bloodDonationWorkflow/ThrottlingError'
import { donationAttributesMock, donationDtoMock, updateDonationAttributesMock } from '../mocks/mockDonationRequestData'
import { GENERIC_CODES } from '../../../../commons/libs/constants/GenericCodes'
import type { NotificationService } from '../../../application/notificationWorkflow/NotificationService'
import { mockLogger } from '../mocks/mockLogger'
import type { UserService } from '../../userWorkflow/UserService'
import { mockRepository } from '../mocks/mockRepositories'
import { mockUserDetailsWithStringId } from '../mocks/mockUserData'
import type { AcceptDonationService } from '../../../application/bloodDonationWorkflow/AcceptDonationRequestService'

jest.mock('../../utils/idGenerator', () => ({
  generateUniqueID: jest.fn()
}))

jest.mock('../../utils/geohash', () => ({
  generateGeohash: jest.fn()
}))

jest.mock('../../utils/validator', () => ({
  validateInputWithRules: jest.fn()
}))

jest.mock('../../../application/notificationWorkflow/NotificationService')
jest.mock('../../../application/bloodDonationWorkflow/AcceptDonationRequestService')

describe('BloodDonationService', () => {
  const mockBloodDonationRepository = {
    ...mockRepository,
    getDonationRequest: jest.fn(),
    getDonationRequestsByDate: jest.fn()
  }

  const mockUserService = {
    ...mockRepository,
    getUser: jest.fn()
  } as unknown as jest.Mocked<UserService>

  const mockNotificationService = {
    updateBloodDonationNotifications: jest.fn()
  } as unknown as jest.Mocked<NotificationService>

  const mockAcceptDonationService = {
    getAcceptedDonorList: jest.fn()
  } as unknown as jest.Mocked<AcceptDonationService>

  const mockCreatedAt = '2024-01-01T00:00:00Z'

  beforeEach(() => {
    jest.resetAllMocks();
    (generateUniqueID as jest.Mock).mockReturnValue('req123');
    (generateGeohash as jest.Mock).mockReturnValue('wh0r35qr');
    (validateInputWithRules as jest.Mock).mockReturnValue(null)

    mockUserService.getUser.mockResolvedValue(mockUserDetailsWithStringId)
  })

  afterEach(() => {
    jest.clearAllMocks()
    jest.resetAllMocks()
  })

  describe('createBloodDonation', () => {
    test('should create a blood donation and return success message', async() => {
      // Arrange
      const bloodDonationService = new BloodDonationService(
        mockBloodDonationRepository,
        mockLogger
      )
      mockBloodDonationRepository.getDonationRequestsByDate.mockResolvedValue([])
      mockBloodDonationRepository.create.mockResolvedValue(donationDtoMock)

      const result = await bloodDonationService.createBloodDonation(
        donationAttributesMock,
        mockUserService
      )

      expect(mockUserService.getUser).toHaveBeenCalledWith(donationAttributesMock.seekerId)

      expect(validateInputWithRules).toHaveBeenCalledWith(
        {
          bloodQuantity: donationAttributesMock.bloodQuantity,
          donationDateTime: donationAttributesMock.donationDateTime
        },
        expect.any(Object)
      )

      expect(generateUniqueID).toHaveBeenCalled()
      expect(generateGeohash).toHaveBeenCalledWith(
        donationAttributesMock.latitude,
        donationAttributesMock.longitude
      )

      expect(mockBloodDonationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...donationDtoMock,
          donationDateTime: expect.any(String),
          createdAt: expect.any(String)
        })
      )

      expect(result).toStrictEqual({ createdAt: expect.any(String), requestPostId: 'req123' })
    })

    test('should throw BloodDonationOperationError if input is invalid', async() => {
      (validateInputWithRules as jest.Mock).mockReturnValue('Validation error')
      const bloodDonationService = new BloodDonationService(
        mockBloodDonationRepository,
        mockLogger
      )

      await expect(
        bloodDonationService.createBloodDonation(
          donationAttributesMock,
          mockUserService
        )
      ).rejects.toThrow(BloodDonationOperationError)

      expect(mockBloodDonationRepository.create).not.toHaveBeenCalled()
    })

    test('should throw BloodDonationOperationError when repository create fails', async() => {
      // Arrange
      mockBloodDonationRepository.create.mockRejectedValue(new Error('Repository error'))
      mockBloodDonationRepository.getDonationRequestsByDate.mockResolvedValue([])
      const bloodDonationService = new BloodDonationService(
        mockBloodDonationRepository,
        mockLogger
      )

      // Act & Assert
      await expect(
        bloodDonationService.createBloodDonation(
          donationAttributesMock,
          mockUserService
        )
      ).rejects.toThrow(BloodDonationOperationError)

      await expect(
        bloodDonationService.createBloodDonation(
          donationAttributesMock,
          mockUserService
        )
      ).rejects.toThrow(/Failed to submit blood donation request/)

      expect(mockBloodDonationRepository.getDonationRequestsByDate).toHaveBeenCalled()
      expect(mockBloodDonationRepository.create).toHaveBeenCalled()
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
      // Arrange
      const bloodDonationService = new BloodDonationService(
        mockBloodDonationRepository,
        mockLogger
      )
      mockBloodDonationRepository.getDonationRequestsByDate.mockResolvedValue(
        Array(9).fill(donationDtoMock)
      )
      mockBloodDonationRepository.create.mockResolvedValue(donationDtoMock)

      // Act
      const result = await bloodDonationService.createBloodDonation(
        donationAttributesMock,
        mockUserService
      )

      // Assert
      expect(result).toStrictEqual({ createdAt: expect.any(String), requestPostId: 'req123' })
      expect(mockBloodDonationRepository.getDonationRequestsByDate).toHaveBeenCalledWith(
        donationAttributesMock.seekerId,
        '2024-01-01'
      )
    })

    test('should throw ThrottlingError when daily limit is reached', async() => {
      // Arrange
      const bloodDonationService = new BloodDonationService(
        mockBloodDonationRepository,
        mockLogger
      )
      mockBloodDonationRepository.getDonationRequestsByDate.mockResolvedValue(
        Array(10).fill(donationDtoMock)
      )

      // Act & Assert
      await expect(
        bloodDonationService.createBloodDonation(
          donationAttributesMock,
          mockUserService
        )
      ).rejects.toThrow(ThrottlingError)

      await expect(
        bloodDonationService.createBloodDonation(
          donationAttributesMock,
          mockUserService
        )
      ).rejects.toThrow(/You've reached today's limit/)
    })

    test('should check throttling with correct date prefix', async() => {
      // Arrange
      jest.setSystemTime(new Date('2024-03-15T23:59:59Z'))

      const bloodDonationService = new BloodDonationService(
        mockBloodDonationRepository,
        mockLogger
      )
      mockBloodDonationRepository.getDonationRequestsByDate.mockResolvedValue([])
      mockBloodDonationRepository.create.mockResolvedValue(donationDtoMock)

      // Act
      await bloodDonationService.createBloodDonation(
        donationAttributesMock,
        mockUserService
      )

      // Assert
      expect(mockBloodDonationRepository.getDonationRequestsByDate).toHaveBeenCalledWith(
        donationAttributesMock.seekerId,
        '2024-03-15'
      )
    })

    test('should handle repository query errors during throttling check', async() => {
      // Arrange
      mockBloodDonationRepository.getDonationRequestsByDate.mockRejectedValue(
        new Error('Database connection error')
      )
      const bloodDonationService = new BloodDonationService(
        mockBloodDonationRepository,
        mockLogger
      )

      // Act & Assert
      await expect(
        bloodDonationService.createBloodDonation(
          donationAttributesMock,
          mockUserService
        )
      ).rejects.toThrow(BloodDonationOperationError)

      await expect(
        bloodDonationService.createBloodDonation(
          donationAttributesMock,
          mockUserService
        )
      ).rejects.toThrow(/Failed to check request limits/)
    })
  })

  describe('getDonationRequest', () => {
    test('should return donation request if it exists', async() => {
      // Arrange
      const bloodDonationService = new BloodDonationService(
        mockBloodDonationRepository,
        mockLogger
      )
      mockBloodDonationRepository.getDonationRequest.mockResolvedValue(donationDtoMock)

      // Act
      const result = await bloodDonationService.getDonationRequest(
        'user123',
        'req123',
        mockCreatedAt
      )

      // Assert
      expect(mockBloodDonationRepository.getDonationRequest).toHaveBeenCalledWith(
        'user123',
        'req123',
        mockCreatedAt
      )
      expect(result).toEqual(donationDtoMock)
    })

    test('should throw error if donation request does not exist', async() => {
      // Arrange
      const bloodDonationService = new BloodDonationService(
        mockBloodDonationRepository,
        mockLogger
      )
      mockBloodDonationRepository.getDonationRequest.mockResolvedValue(null)

      // Act & Assert
      await expect(
        bloodDonationService.getDonationRequest(
          'user123',
          'req123',
          mockCreatedAt
        )
      ).rejects.toThrow('Donation not found.')
    })
  })

  describe('updateBloodDonation', () => {
    test('should update blood donation if request exists and not cancelled', async() => {
      // Arrange
      const bloodDonationService = new BloodDonationService(
        mockBloodDonationRepository,
        mockLogger
      )

      const existingDonation: DonationDTO = {
        ...donationDtoMock,
        requestPostId: donationDtoMock.requestPostId,
        status: DonationStatus.PENDING
      }

      mockBloodDonationRepository.getDonationRequest.mockResolvedValue(existingDonation)
      mockAcceptDonationService.getAcceptedDonorList.mockResolvedValue([])
      mockBloodDonationRepository.update.mockResolvedValue(donationDtoMock)

      const result = await bloodDonationService.updateBloodDonation(
        updateDonationAttributesMock,
        mockNotificationService,
        mockAcceptDonationService
      )

      expect(mockBloodDonationRepository.getDonationRequest).toHaveBeenCalledWith(
        donationDtoMock.seekerId,
        donationDtoMock.requestPostId,
        donationDtoMock.createdAt
      )
      expect(mockBloodDonationRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          ...updateDonationAttributesMock,
          requestPostId: donationDtoMock.requestPostId,
          createdAt: donationDtoMock.createdAt,
          donationDateTime: expect.any(String)
        })
      )
      expect(mockNotificationService.updateBloodDonationNotifications).toHaveBeenCalledWith(
        'req123',
        expect.any(Object)
      )
      expect(result).toStrictEqual({ createdAt: donationDtoMock.createdAt, requestPostId: 'req123' })
    })

    test('should throw BloodDonationOperationError if request does not exist', async() => {
      // Arrange
      const bloodDonationService = new BloodDonationService(
        mockBloodDonationRepository,
        mockLogger
      )
      mockBloodDonationRepository.getDonationRequest.mockResolvedValue(null)

      // Act & Assert
      await expect(bloodDonationService.updateBloodDonation(
        updateDonationAttributesMock,
        mockNotificationService,
        mockAcceptDonationService
      )).rejects.toThrow(BloodDonationOperationError)

      expect(mockBloodDonationRepository.update).not.toHaveBeenCalled()
    })

    test('should throw Error when validating donationDateTime', async() => {
      // Arrange
      const bloodDonationService = new BloodDonationService(
        mockBloodDonationRepository,
        mockLogger
      )

      const existingDonation: DonationDTO = {
        ...donationDtoMock,
        requestPostId: 'req123',
        status: DonationStatus.PENDING,
        createdAt: mockCreatedAt
      }

      mockBloodDonationRepository.getDonationRequest.mockResolvedValue(existingDonation);
      (validateInputWithRules as jest.Mock).mockReturnValue('Invalid donation date')

      const donationAttributes = {
        ...updateDonationAttributesMock,
        seekerId: 'user123',
        requestPostId: 'req123',
        createdAt: mockCreatedAt,
        donationDateTime: 'invalid-date'
      }

      // Act & Assert
      await expect(bloodDonationService.updateBloodDonation(
        donationAttributes,
        mockNotificationService,
        mockAcceptDonationService
      )).rejects.toThrow('Invalid donation date')

      expect(validateInputWithRules).toHaveBeenCalledWith(
        { donationDateTime: 'invalid-date' },
        expect.any(Object)
      )
      expect(mockBloodDonationRepository.update).not.toHaveBeenCalled()
    })

    test('should throw BloodDonationOperationError if blood donation is already cancelled', async() => {
      // Arrange
      const bloodDonationService = new BloodDonationService(
        mockBloodDonationRepository,
        mockLogger
      )

      const cancelledDonation: DonationDTO = {
        ...donationDtoMock,
        requestPostId: 'req123',
        status: DonationStatus.CANCELLED,
        createdAt: mockCreatedAt
      }

      mockBloodDonationRepository.getDonationRequest.mockResolvedValue(cancelledDonation)

      const donationAttributes = {
        ...updateDonationAttributesMock,
        seekerId: 'user123',
        requestPostId: 'req123',
        createdAt: mockCreatedAt,
        bloodQuantity: 3
      }

      // Act & Assert
      await expect(bloodDonationService.updateBloodDonation(
        donationAttributes,
        mockNotificationService,
        mockAcceptDonationService
      )).rejects.toThrow("You can't update a cancelled request")

      expect(mockBloodDonationRepository.update).not.toHaveBeenCalled()
    })

    test('should throw BloodDonationOperationError when the update operation fails', async() => {
      // Arrange
      const bloodDonationService = new BloodDonationService(
        mockBloodDonationRepository,
        mockLogger
      )

      const existingDonation: DonationDTO = {
        ...donationDtoMock,
        requestPostId: 'req123',
        status: DonationStatus.PENDING,
        createdAt: mockCreatedAt
      }

      mockBloodDonationRepository.getDonationRequest.mockResolvedValue(existingDonation)
      mockAcceptDonationService.getAcceptedDonorList.mockResolvedValue([])
      mockBloodDonationRepository.update.mockRejectedValue(new Error('Update failed'))

      const donationAttributes = {
        ...updateDonationAttributesMock,
        seekerId: 'user123',
        requestPostId: 'req123',
        createdAt: mockCreatedAt,
        bloodQuantity: 3
      }

      // Act & Assert
      await expect(bloodDonationService.updateBloodDonation(
        donationAttributes,
        mockNotificationService,
        mockAcceptDonationService
      )).rejects.toThrow(BloodDonationOperationError)

      await expect(bloodDonationService.updateBloodDonation(
        donationAttributes,
        mockNotificationService,
        mockAcceptDonationService
      )).rejects.toThrow(/Failed to update blood donation post/)
    })

    test('should throw BloodDonationOperationError directly if it is thrown during update', async() => {
      // Arrange
      const bloodDonationService = new BloodDonationService(
        mockBloodDonationRepository,
        mockLogger
      )

      const existingDonation: DonationDTO = {
        ...donationDtoMock,
        requestPostId: 'req123',
        status: DonationStatus.PENDING,
        createdAt: mockCreatedAt
      }

      mockBloodDonationRepository.getDonationRequest.mockResolvedValue(existingDonation)
      mockAcceptDonationService.getAcceptedDonorList.mockResolvedValue([])
      mockBloodDonationRepository.update.mockRejectedValue(
        new BloodDonationOperationError('Operation failed', GENERIC_CODES.ERROR)
      )

      const donationAttributes = {
        ...updateDonationAttributesMock,
        seekerId: 'user123',
        requestPostId: 'req123',
        createdAt: mockCreatedAt,
        bloodQuantity: 3
      }

      // Act & Assert
      await expect(bloodDonationService.updateBloodDonation(
        donationAttributes,
        mockNotificationService,
        mockAcceptDonationService
      )).rejects.toThrow(/Operation failed/)
    })
  })
})
