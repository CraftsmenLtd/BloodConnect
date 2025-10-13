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
    jest.clearAllMocks();
    (generateUniqueID as jest.Mock).mockReturnValue('req123');
    (generateGeohash as jest.Mock).mockReturnValue('wh0r35qr');
    (validateInputWithRules as jest.Mock).mockReturnValue(null)

    mockUserService.getUser.mockResolvedValue(mockUserDetailsWithStringId)
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
      ).rejects.toThrow(
        expect.objectContaining({
          message: expect.stringContaining('Failed to submit blood donation request')
        })
      )

      expect(mockBloodDonationRepository.getDonationRequestsByDate).toHaveBeenCalled()
      expect(mockBloodDonationRepository.create).toHaveBeenCalled()
    })

    test('should re-throw ThrottlingError when caught during repository create', async () => {
      const throttlingError = new ThrottlingError(
        'Too many requests',
        GENERIC_CODES.TOO_MANY_REQUESTS
      )
      mockBloodDonationRepository.create.mockRejectedValue(throttlingError)
      mockBloodDonationRepository.getDonationRequestsByDate.mockResolvedValue([])
      const bloodDonationService = new BloodDonationService(
        mockBloodDonationRepository,
        mockLogger
      )

      await expect(
        bloodDonationService.createBloodDonation(
          donationAttributesMock,
          mockUserService
        )
      ).rejects.toThrow(ThrottlingError)

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
      ).rejects.toThrow(
        expect.objectContaining({
          message: expect.stringContaining('You\'ve reached today\'s limit')
        })
      )

      expect(mockBloodDonationRepository.getDonationRequestsByDate).toHaveBeenCalled()
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
      ).rejects.toThrow(
        expect.objectContaining({
          message: expect.stringContaining('Failed to check request limits')
        })
      )

      expect(mockBloodDonationRepository.getDonationRequestsByDate).toHaveBeenCalled()
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
      )).rejects.toThrow(
        expect.objectContaining({
          message: expect.stringContaining('Failed to update blood donation post')
        })
      )

      expect(mockBloodDonationRepository.update).toHaveBeenCalled()
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

    test('should change status from MANAGED to PENDING when blood quantity increases', async () => {
      const bloodDonationService = new BloodDonationService(
        mockBloodDonationRepository,
        mockLogger
      )

      const existingDonation: DonationDTO = {
        ...donationDtoMock,
        requestPostId: 'req123',
        status: DonationStatus.MANAGED,
        bloodQuantity: 2,
        createdAt: mockCreatedAt
      }

      mockBloodDonationRepository.getDonationRequest.mockResolvedValue(existingDonation)
      mockAcceptDonationService.getAcceptedDonorList.mockResolvedValue([
        { donorId: 'donor1' },
        { donorId: 'donor2' }
      ])
      mockBloodDonationRepository.update.mockResolvedValue(donationDtoMock)

      const donationAttributes = {
        ...updateDonationAttributesMock,
        seekerId: 'user123',
        requestPostId: 'req123',
        createdAt: mockCreatedAt,
        bloodQuantity: 5
      }

      await bloodDonationService.updateBloodDonation(
        donationAttributes,
        mockNotificationService,
        mockAcceptDonationService
      )

      expect(mockBloodDonationRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: DonationStatus.PENDING
        })
      )
    })

    test('should change status from PENDING to MANAGED when enough donors accept', async () => {
      const bloodDonationService = new BloodDonationService(
        mockBloodDonationRepository,
        mockLogger
      )

      const existingDonation: DonationDTO = {
        ...donationDtoMock,
        requestPostId: 'req123',
        status: DonationStatus.PENDING,
        bloodQuantity: 2,
        createdAt: mockCreatedAt
      }

      mockBloodDonationRepository.getDonationRequest.mockResolvedValue(existingDonation)
      mockAcceptDonationService.getAcceptedDonorList.mockResolvedValue([
        { donorId: 'donor1' },
        { donorId: 'donor2' }
      ])
      mockBloodDonationRepository.update.mockResolvedValue(donationDtoMock)

      const donationAttributes = {
        ...updateDonationAttributesMock,
        seekerId: 'user123',
        requestPostId: 'req123',
        createdAt: mockCreatedAt,
        bloodQuantity: 2
      }

      await bloodDonationService.updateBloodDonation(
        donationAttributes,
        mockNotificationService,
        mockAcceptDonationService
      )

      expect(mockBloodDonationRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: DonationStatus.MANAGED
        })
      )
    })
  })

  describe('updateDonationStatus', () => {
    test('should update donation status successfully', async () => {
      const bloodDonationService = new BloodDonationService(
        mockBloodDonationRepository,
        mockLogger
      )

      mockBloodDonationRepository.getDonationRequest.mockResolvedValue(donationDtoMock)
      mockBloodDonationRepository.update.mockResolvedValue(donationDtoMock)

      await bloodDonationService.updateDonationStatus(
        'user123',
        'req123',
        mockCreatedAt,
        DonationStatus.COMPLETED
      )

      expect(mockBloodDonationRepository.getDonationRequest).toHaveBeenCalledWith(
        'user123',
        'req123',
        mockCreatedAt
      )
      expect(mockBloodDonationRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          seekerId: 'user123',
          requestPostId: 'req123',
          createdAt: mockCreatedAt,
          status: DonationStatus.COMPLETED
        })
      )
    })

    test('should throw error if donation not found', async () => {
      const bloodDonationService = new BloodDonationService(
        mockBloodDonationRepository,
        mockLogger
      )

      mockBloodDonationRepository.getDonationRequest.mockResolvedValue(null)

      await expect(
        bloodDonationService.updateDonationStatus(
          'user123',
          'req123',
          mockCreatedAt,
          DonationStatus.CANCELLED
        )
      ).rejects.toThrow('Donation not found.')
    })
  })

  describe('checkAndUpdateDonationStatus', () => {
    test('should change status to MANAGED when enough donors accept', async () => {
      const bloodDonationService = new BloodDonationService(
        mockBloodDonationRepository,
        mockLogger
      )

      const pendingDonation: DonationDTO = {
        ...donationDtoMock,
        requestPostId: 'req123',
        status: DonationStatus.PENDING,
        bloodQuantity: 2,
        createdAt: mockCreatedAt
      }

      mockBloodDonationRepository.getDonationRequest
        .mockResolvedValueOnce(pendingDonation)
        .mockResolvedValueOnce(pendingDonation)

      mockAcceptDonationService.getAcceptedDonorList.mockResolvedValue([
        { donorId: 'donor1' },
        { donorId: 'donor2' }
      ])
      mockBloodDonationRepository.update.mockResolvedValue(donationDtoMock)

      await bloodDonationService.checkAndUpdateDonationStatus(
        'user123',
        'req123',
        mockCreatedAt,
        mockAcceptDonationService
      )

      expect(mockBloodDonationRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: DonationStatus.MANAGED
        })
      )
    })

    test('should change status to PENDING when not enough donors', async () => {
      const bloodDonationService = new BloodDonationService(
        mockBloodDonationRepository,
        mockLogger
      )

      const managedDonation: DonationDTO = {
        ...donationDtoMock,
        requestPostId: 'req123',
        status: DonationStatus.MANAGED,
        bloodQuantity: 3,
        createdAt: mockCreatedAt
      }

      mockBloodDonationRepository.getDonationRequest
        .mockResolvedValueOnce(managedDonation)
        .mockResolvedValueOnce(managedDonation)

      mockAcceptDonationService.getAcceptedDonorList.mockResolvedValue([
        { donorId: 'donor1' }
      ])
      mockBloodDonationRepository.update.mockResolvedValue(donationDtoMock)

      await bloodDonationService.checkAndUpdateDonationStatus(
        'user123',
        'req123',
        mockCreatedAt,
        mockAcceptDonationService
      )

      expect(mockBloodDonationRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: DonationStatus.PENDING
        })
      )
    })

    test('should not update status when already correct', async () => {
      const bloodDonationService = new BloodDonationService(
        mockBloodDonationRepository,
        mockLogger
      )

      const pendingDonation: DonationDTO = {
        ...donationDtoMock,
        requestPostId: 'req123',
        status: DonationStatus.PENDING,
        bloodQuantity: 3,
        createdAt: mockCreatedAt
      }

      mockBloodDonationRepository.getDonationRequest.mockResolvedValue(pendingDonation)
      mockAcceptDonationService.getAcceptedDonorList.mockResolvedValue([
        { donorId: 'donor1' }
      ])

      await bloodDonationService.checkAndUpdateDonationStatus(
        'user123',
        'req123',
        mockCreatedAt,
        mockAcceptDonationService
      )

      expect(mockBloodDonationRepository.update).not.toHaveBeenCalled()
    })
  })

  describe('getDonationRequestDetails', () => {
    test('should return donation request with accepted donors', async () => {
      const bloodDonationService = new BloodDonationService(
        mockBloodDonationRepository,
        mockLogger
      )

      mockBloodDonationRepository.getDonationRequest.mockResolvedValue(donationDtoMock)
      const acceptedDonors = [
        { donorId: 'donor1', status: 'ACCEPTED' },
        { donorId: 'donor2', status: 'ACCEPTED' }
      ]
      mockAcceptDonationService.getAcceptedDonorList.mockResolvedValue(acceptedDonors)

      const result = await bloodDonationService.getDonationRequestDetails(
        'user123',
        'req123',
        mockCreatedAt,
        mockAcceptDonationService
      )

      expect(mockBloodDonationRepository.getDonationRequest).toHaveBeenCalledWith(
        'user123',
        'req123',
        mockCreatedAt
      )
      expect(mockAcceptDonationService.getAcceptedDonorList).toHaveBeenCalledWith(
        'user123',
        'req123'
      )
      expect(result).toEqual({
        ...donationDtoMock,
        acceptedDonors
      })
    })
  })

  describe('completeDonationRequest', () => {
    const mockDonationRecordService = {
      createDonationRecord: jest.fn()
    }
    const mockNotificationServiceComplete = {
      updateBloodDonationNotificationStatus: jest.fn(),
      sendNotification: jest.fn()
    }
    const mockUserServiceComplete = {
      updateUserAttributes: jest.fn()
    }
    const mockLocationService = {
      updateUserLocation: jest.fn()
    }
    const mockQueueModel = {
      queue: jest.fn()
    }

    beforeEach(() => {
      mockDonationRecordService.createDonationRecord.mockResolvedValue(undefined)
      mockNotificationServiceComplete.updateBloodDonationNotificationStatus.mockResolvedValue(undefined)
      mockNotificationServiceComplete.sendNotification.mockResolvedValue(undefined)
      mockUserServiceComplete.updateUserAttributes.mockResolvedValue(undefined)
    })

    test('should complete donation request and update all donors', async () => {
      const bloodDonationService = new BloodDonationService(
        mockBloodDonationRepository,
        mockLogger
      )

      mockBloodDonationRepository.getDonationRequest.mockResolvedValue(donationDtoMock)
      mockBloodDonationRepository.update.mockResolvedValue(donationDtoMock)

      await bloodDonationService.completeDonationRequest(
        'user123',
        'req123',
        mockCreatedAt,
        ['donor1', 'donor2'],
        mockDonationRecordService as any,
        mockUserServiceComplete as any,
        mockNotificationServiceComplete as any,
        mockLocationService as any,
        4,
        mockQueueModel as any,
        'https://queue-url'
      )

      expect(mockBloodDonationRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: DonationStatus.COMPLETED
        })
      )
      expect(mockDonationRecordService.createDonationRecord).toHaveBeenCalledTimes(2)
      expect(mockNotificationServiceComplete.updateBloodDonationNotificationStatus).toHaveBeenCalledTimes(2)
      expect(mockUserServiceComplete.updateUserAttributes).toHaveBeenCalledTimes(2)
    })

    test('should create donation records for each donor', async () => {
      const bloodDonationService = new BloodDonationService(
        mockBloodDonationRepository,
        mockLogger
      )

      mockBloodDonationRepository.getDonationRequest.mockResolvedValue(donationDtoMock)
      mockBloodDonationRepository.update.mockResolvedValue(donationDtoMock)

      await bloodDonationService.completeDonationRequest(
        'user123',
        'req123',
        mockCreatedAt,
        ['donor1'],
        mockDonationRecordService as any,
        mockUserServiceComplete as any,
        mockNotificationServiceComplete as any,
        mockLocationService as any,
        4,
        mockQueueModel as any,
        'https://queue-url'
      )

      expect(mockDonationRecordService.createDonationRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          donorId: 'donor1',
          seekerId: 'user123',
          requestPostId: 'req123',
          requestCreatedAt: mockCreatedAt
        })
      )
    })

    test('should update donor availability to false after completion', async () => {
      const bloodDonationService = new BloodDonationService(
        mockBloodDonationRepository,
        mockLogger
      )

      mockBloodDonationRepository.getDonationRequest.mockResolvedValue(donationDtoMock)
      mockBloodDonationRepository.update.mockResolvedValue(donationDtoMock)

      await bloodDonationService.completeDonationRequest(
        'user123',
        'req123',
        mockCreatedAt,
        ['donor1'],
        mockDonationRecordService as any,
        mockUserServiceComplete as any,
        mockNotificationServiceComplete as any,
        mockLocationService as any,
        4,
        mockQueueModel as any,
        'https://queue-url'
      )

      expect(mockUserServiceComplete.updateUserAttributes).toHaveBeenCalledWith(
        'donor1',
        expect.objectContaining({
          lastDonationDate: expect.any(String),
          availableForDonation: false
        }),
        mockLocationService,
        4
      )
    })

    test('should send thank you notifications to all donors', async () => {
      const bloodDonationService = new BloodDonationService(
        mockBloodDonationRepository,
        mockLogger
      )

      mockBloodDonationRepository.getDonationRequest.mockResolvedValue(donationDtoMock)
      mockBloodDonationRepository.update.mockResolvedValue(donationDtoMock)

      await bloodDonationService.completeDonationRequest(
        'user123',
        'req123',
        mockCreatedAt,
        ['donor1', 'donor2'],
        mockDonationRecordService as any,
        mockUserServiceComplete as any,
        mockNotificationServiceComplete as any,
        mockLocationService as any,
        4,
        mockQueueModel as any,
        'https://queue-url'
      )

      expect(mockNotificationServiceComplete.sendNotification).toHaveBeenCalledTimes(2)
      expect(mockNotificationServiceComplete.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'donor1',
          title: 'Thank you for your donation',
          body: expect.stringContaining('Thank you for your donation')
        }),
        mockQueueModel,
        'https://queue-url'
      )
    })
  })
})
