import { AcceptDonationService } from '../../bloodDonationWorkflow/AcceptDonationRequestService'
import { AcceptDonationStatus, DonationStatus } from '../../../../commons/dto/DonationDTO'
import type { AcceptDonationDTO, DonationDTO } from '../../../../commons/dto/DonationDTO'
import type { UserDetailsDTO } from '../../../../commons/dto/UserDTO'
import { mockLogger } from '../mocks/mockLogger'
import type { BloodDonationService } from '../../bloodDonationWorkflow/BloodDonationRequestService'
import type { UserService } from '../../userWorkflow/UserService'
import type { NotificationService } from '../../notificationWorkflow/NotificationService'
import type { QueueModel } from '../../models/queue/QueueModel'
import AcceptDonationRequestError from '../../bloodDonationWorkflow/AcceptDonationRequestError'
import { NotificationType } from '../../../../commons/dto/NotificationDTO'

describe('AcceptDonationService', () => {
  const mockAcceptDonationRepository = {
    create: jest.fn(),
    update: jest.fn(),
    getAcceptedRequest: jest.fn(),
    queryAcceptedRequests: jest.fn(),
    deleteAcceptedRequest: jest.fn()
  }

  const mockBloodDonationService = {
    getDonationRequest: jest.fn()
  } as unknown as jest.Mocked<BloodDonationService>

  const mockUserService = {
    getUser: jest.fn()
  } as unknown as jest.Mocked<UserService>

  const mockNotificationService = {
    getBloodDonationNotification: jest.fn(),
    createBloodDonationNotification: jest.fn(),
    updateBloodDonationNotificationStatus: jest.fn(),
    sendNotification: jest.fn()
  } as unknown as jest.Mocked<NotificationService>

  const mockQueueModel = {
    queue: jest.fn()
  } as unknown as jest.Mocked<QueueModel>

  const mockDonorProfile: UserDetailsDTO = {
    id: 'donor123',
    name: 'Donor Name',
    phoneNumbers: ['+8801234567890'],
    bloodGroup: 'A+',
    countryCode: 'BD',
    age: 25,
    email: 'donor@example.com',
    availableForDonation: true
  }

  const mockSeekerProfile: UserDetailsDTO = {
    id: 'seeker123',
    name: 'Seeker Name',
    phoneNumbers: ['+8801987654321'],
    bloodGroup: 'O+',
    countryCode: 'BD',
    age: 30,
    email: 'seeker@example.com',
    availableForDonation: false
  }

  const mockDonationPost: DonationDTO = {
    seekerId: 'seeker123',
    requestPostId: 'req123',
    createdAt: '2024-01-01T00:00:00Z',
    status: DonationStatus.PENDING,
    bloodQuantity: 3,
    requestedBloodGroup: 'A+',
    urgencyLevel: 'urgent',
    donationDateTime: '2024-01-10T00:00:00Z',
    countryCode: 'BD',
    geohash: 'wh0r35qr',
    location: 'Dhaka',
    contactNumber: '+8801234567890',
    patientName: 'Patient',
    transportationInfo: 'Available',
    shortDescription: 'Emergency',
    seekerName: 'Seeker Name'
  }

  const notificationQueueUrl = 'https://notification.queue.url'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('acceptDonationRequest', () => {
    test('should create acceptance record and send notifications when donor accepts for first time', async() => {
      // Arrange
      const acceptDonationService = new AcceptDonationService(
        mockAcceptDonationRepository,
        mockLogger
      )
      mockAcceptDonationRepository.getAcceptedRequest.mockResolvedValue(null)
      mockAcceptDonationRepository.create.mockResolvedValue({} as AcceptDonationDTO)
      mockAcceptDonationRepository.queryAcceptedRequests.mockResolvedValue([])
      mockUserService.getUser
        .mockResolvedValueOnce(mockDonorProfile)
        .mockResolvedValueOnce(mockSeekerProfile)
      mockBloodDonationService.getDonationRequest.mockResolvedValue(mockDonationPost)
      mockNotificationService.getBloodDonationNotification.mockResolvedValue(null)

      // Act
      await acceptDonationService.acceptDonationRequest(
        'donor123',
        'seeker123',
        'req123',
        '2024-01-01T00:00:00Z',
        AcceptDonationStatus.ACCEPTED,
        mockBloodDonationService,
        mockUserService,
        mockNotificationService,
        mockQueueModel,
        notificationQueueUrl
      )

      // Assert
      expect(mockAcceptDonationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          donorId: 'donor123',
          seekerId: 'seeker123',
          requestPostId: 'req123',
          status: AcceptDonationStatus.ACCEPTED,
          donorName: 'Donor Name',
          phoneNumbers: ['+8801234567890'],
          acceptanceTime: expect.any(String)
        })
      )
      expect(mockNotificationService.sendNotification).toHaveBeenCalled()
      expect(mockNotificationService.createBloodDonationNotification).toHaveBeenCalled()
    })

    test('should throw error when status is invalid', async() => {
      // Arrange
      const acceptDonationService = new AcceptDonationService(
        mockAcceptDonationRepository,
        mockLogger
      )

      // Act & Assert
      await expect(
        acceptDonationService.acceptDonationRequest(
          'donor123',
          'seeker123',
          'req123',
          '2024-01-01T00:00:00Z',
          'INVALID_STATUS' as AcceptDonationStatus,
          mockBloodDonationService,
          mockUserService,
          mockNotificationService,
          mockQueueModel,
          notificationQueueUrl
        )
      ).rejects.toThrow('Invalid status for donation response.')
    })

    test('should throw error when donor already donated', async() => {
      // Arrange
      const acceptDonationService = new AcceptDonationService(
        mockAcceptDonationRepository,
        mockLogger
      )
      const existingRecord: AcceptDonationDTO = {
        donorId: 'donor123',
        seekerId: 'seeker123',
        requestPostId: 'req123',
        createdAt: '2024-01-01T00:00:00Z',
        status: AcceptDonationStatus.COMPLETED,
        donorName: 'Donor Name',
        phoneNumbers: ['+8801234567890'],
        acceptanceTime: '2024-01-01T01:00:00Z'
      }
      mockAcceptDonationRepository.getAcceptedRequest.mockResolvedValue(existingRecord)

      // Act & Assert
      await expect(
        acceptDonationService.acceptDonationRequest(
          'donor123',
          'seeker123',
          'req123',
          '2024-01-01T00:00:00Z',
          AcceptDonationStatus.ACCEPTED,
          mockBloodDonationService,
          mockUserService,
          mockNotificationService,
          mockQueueModel,
          notificationQueueUrl
        )
      ).rejects.toThrow('You already donated.')
    })

    test('should throw error when blood group does not match', async() => {
      // Arrange
      const acceptDonationService = new AcceptDonationService(
        mockAcceptDonationRepository,
        mockLogger
      )
      const mismatchedDonorProfile = { ...mockDonorProfile, bloodGroup: 'B+' }
      mockAcceptDonationRepository.getAcceptedRequest.mockResolvedValue(null)
      mockUserService.getUser.mockResolvedValue(mismatchedDonorProfile)
      mockBloodDonationService.getDonationRequest.mockResolvedValue(mockDonationPost)

      // Act & Assert
      await expect(
        acceptDonationService.acceptDonationRequest(
          'donor123',
          'seeker123',
          'req123',
          '2024-01-01T00:00:00Z',
          AcceptDonationStatus.ACCEPTED,
          mockBloodDonationService,
          mockUserService,
          mockNotificationService,
          mockQueueModel,
          notificationQueueUrl
        )
      ).rejects.toThrow('Your blood group doesn\'t match with the request blood group')
    })

    test('should throw error when donation request is not available', async() => {
      // Arrange
      const acceptDonationService = new AcceptDonationService(
        mockAcceptDonationRepository,
        mockLogger
      )
      const completedDonationPost = { ...mockDonationPost, status: DonationStatus.COMPLETED }
      mockAcceptDonationRepository.getAcceptedRequest.mockResolvedValue(null)
      mockUserService.getUser.mockResolvedValue(mockDonorProfile)
      mockBloodDonationService.getDonationRequest.mockResolvedValue(completedDonationPost)

      // Act & Assert
      await expect(
        acceptDonationService.acceptDonationRequest(
          'donor123',
          'seeker123',
          'req123',
          '2024-01-01T00:00:00Z',
          AcceptDonationStatus.ACCEPTED,
          mockBloodDonationService,
          mockUserService,
          mockNotificationService,
          mockQueueModel,
          notificationQueueUrl
        )
      ).rejects.toThrow('Donation request is no longer available for acceptance.')
    })

    test('should delete acceptance record when donor ignores after accepting', async() => {
      // Arrange
      const acceptDonationService = new AcceptDonationService(
        mockAcceptDonationRepository,
        mockLogger
      )
      const existingRecord: AcceptDonationDTO = {
        donorId: 'donor123',
        seekerId: 'seeker123',
        requestPostId: 'req123',
        createdAt: '2024-01-01T00:00:00Z',
        status: AcceptDonationStatus.ACCEPTED,
        donorName: 'Donor Name',
        phoneNumbers: ['+8801234567890'],
        acceptanceTime: '2024-01-01T01:00:00Z'
      }
      mockAcceptDonationRepository.getAcceptedRequest.mockResolvedValue(existingRecord)
      mockUserService.getUser
        .mockResolvedValueOnce(mockDonorProfile)
        .mockResolvedValueOnce(mockSeekerProfile)
      mockBloodDonationService.getDonationRequest.mockResolvedValue(mockDonationPost)
      mockNotificationService.getBloodDonationNotification.mockResolvedValue({
        id: 'req123',
        userId: 'donor123',
        type: NotificationType.BLOOD_REQ_POST,
        status: AcceptDonationStatus.ACCEPTED,
        title: 'Blood Request',
        body: 'A+ blood needed',
        payload: {},
        createdAt: '2024-01-01T00:00:00Z'
      })

      // Act
      await acceptDonationService.acceptDonationRequest(
        'donor123',
        'seeker123',
        'req123',
        '2024-01-01T00:00:00Z',
        AcceptDonationStatus.IGNORED,
        mockBloodDonationService,
        mockUserService,
        mockNotificationService,
        mockQueueModel,
        notificationQueueUrl
      )

      // Assert
      expect(mockAcceptDonationRepository.deleteAcceptedRequest).toHaveBeenCalledWith(
        'seeker123',
        'req123',
        'donor123'
      )
      expect(mockNotificationService.sendNotification).toHaveBeenCalled()
      expect(mockNotificationService.updateBloodDonationNotificationStatus).toHaveBeenCalledWith(
        'donor123',
        'req123',
        NotificationType.BLOOD_REQ_POST,
        AcceptDonationStatus.IGNORED
      )
    })

    test('should not create acceptance record when donor ignores for first time', async() => {
      // Arrange
      const acceptDonationService = new AcceptDonationService(
        mockAcceptDonationRepository,
        mockLogger
      )
      mockAcceptDonationRepository.getAcceptedRequest.mockResolvedValue(null)
      mockUserService.getUser
        .mockResolvedValueOnce(mockDonorProfile)
        .mockResolvedValueOnce(mockSeekerProfile)
      mockBloodDonationService.getDonationRequest.mockResolvedValue(mockDonationPost)
      mockNotificationService.getBloodDonationNotification.mockResolvedValue({
        id: 'req123',
        userId: 'donor123',
        type: NotificationType.BLOOD_REQ_POST,
        status: AcceptDonationStatus.PENDING,
        title: 'Blood Request',
        body: 'A+ blood needed',
        payload: {},
        createdAt: '2024-01-01T00:00:00Z'
      })

      // Act
      await acceptDonationService.acceptDonationRequest(
        'donor123',
        'seeker123',
        'req123',
        '2024-01-01T00:00:00Z',
        AcceptDonationStatus.IGNORED,
        mockBloodDonationService,
        mockUserService,
        mockNotificationService,
        mockQueueModel,
        notificationQueueUrl
      )

      // Assert
      expect(mockAcceptDonationRepository.create).not.toHaveBeenCalled()
      expect(mockNotificationService.updateBloodDonationNotificationStatus).toHaveBeenCalled()
    })

    test('should allow MANAGED donation status for acceptance', async() => {
      // Arrange
      const acceptDonationService = new AcceptDonationService(
        mockAcceptDonationRepository,
        mockLogger
      )
      const managedDonationPost = { ...mockDonationPost, status: DonationStatus.MANAGED }
      mockAcceptDonationRepository.getAcceptedRequest.mockResolvedValue(null)
      mockAcceptDonationRepository.create.mockResolvedValue({} as AcceptDonationDTO)
      mockAcceptDonationRepository.queryAcceptedRequests.mockResolvedValue([])
      mockUserService.getUser
        .mockResolvedValueOnce(mockDonorProfile)
        .mockResolvedValueOnce(mockSeekerProfile)
      mockBloodDonationService.getDonationRequest.mockResolvedValue(managedDonationPost)
      mockNotificationService.getBloodDonationNotification.mockResolvedValue(null)

      // Act
      await acceptDonationService.acceptDonationRequest(
        'donor123',
        'seeker123',
        'req123',
        '2024-01-01T00:00:00Z',
        AcceptDonationStatus.ACCEPTED,
        mockBloodDonationService,
        mockUserService,
        mockNotificationService,
        mockQueueModel,
        notificationQueueUrl
      )

      // Assert
      expect(mockAcceptDonationRepository.create).toHaveBeenCalled()
    })
  })

  describe('createAcceptanceRecord', () => {
    test('should create acceptance record with correct attributes', async() => {
      // Arrange
      const acceptDonationService = new AcceptDonationService(
        mockAcceptDonationRepository,
        mockLogger
      )
      mockAcceptDonationRepository.create.mockResolvedValue({} as AcceptDonationDTO)

      // Act
      await acceptDonationService.createAcceptanceRecord(
        'donor123',
        'seeker123',
        '2024-01-01T00:00:00Z',
        'req123',
        mockDonorProfile
      )

      // Assert
      expect(mockAcceptDonationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          donorId: 'donor123',
          seekerId: 'seeker123',
          createdAt: '2024-01-01T00:00:00Z',
          requestPostId: 'req123',
          status: AcceptDonationStatus.ACCEPTED,
          donorName: 'Donor Name',
          phoneNumbers: ['+8801234567890'],
          acceptanceTime: expect.any(String)
        })
      )
    })

    test('should throw AcceptDonationRequestError when repository create fails', async() => {
      // Arrange
      const acceptDonationService = new AcceptDonationService(
        mockAcceptDonationRepository,
        mockLogger
      )
      mockAcceptDonationRepository.create.mockRejectedValue(new Error('Database error'))

      // Act & Assert
      await expect(
        acceptDonationService.createAcceptanceRecord(
          'donor123',
          'seeker123',
          '2024-01-01T00:00:00Z',
          'req123',
          mockDonorProfile
        )
      ).rejects.toThrow(AcceptDonationRequestError)
    })
  })

  describe('updateAcceptanceRecord', () => {
    test('should update acceptance record', async() => {
      // Arrange
      const acceptDonationService = new AcceptDonationService(
        mockAcceptDonationRepository,
        mockLogger
      )
      const updateAttributes = {
        donorId: 'donor123',
        seekerId: 'seeker123',
        createdAt: '2024-01-01T00:00:00Z',
        requestPostId: 'req123',
        status: AcceptDonationStatus.COMPLETED,
        donorName: 'Donor Name',
        phoneNumbers: ['+8801234567890']
      }
      mockAcceptDonationRepository.update.mockResolvedValue({} as AcceptDonationDTO)

      // Act
      await acceptDonationService.updateAcceptanceRecord(updateAttributes)

      // Assert
      expect(mockAcceptDonationRepository.update).toHaveBeenCalledWith(updateAttributes)
    })

    test('should throw AcceptDonationRequestError when update fails', async() => {
      // Arrange
      const acceptDonationService = new AcceptDonationService(
        mockAcceptDonationRepository,
        mockLogger
      )
      mockAcceptDonationRepository.update.mockRejectedValue(new Error('Update failed'))

      // Act & Assert
      await expect(
        acceptDonationService.updateAcceptanceRecord({
          donorId: 'donor123',
          seekerId: 'seeker123',
          createdAt: '2024-01-01T00:00:00Z',
          requestPostId: 'req123',
          status: AcceptDonationStatus.COMPLETED,
          donorName: 'Donor Name',
          phoneNumbers: ['+8801234567890']
        })
      ).rejects.toThrow(AcceptDonationRequestError)
    })
  })

  describe('updateAcceptanceRecordStatus', () => {
    test('should update acceptance record status', async() => {
      // Arrange
      const acceptDonationService = new AcceptDonationService(
        mockAcceptDonationRepository,
        mockLogger
      )
      mockAcceptDonationRepository.update.mockResolvedValue({} as AcceptDonationDTO)

      // Act
      await acceptDonationService.updateAcceptanceRecordStatus(
        'seeker123',
        'req123',
        'donor123',
        AcceptDonationStatus.COMPLETED
      )

      // Assert
      expect(mockAcceptDonationRepository.update).toHaveBeenCalledWith({
        seekerId: 'seeker123',
        requestPostId: 'req123',
        donorId: 'donor123',
        status: AcceptDonationStatus.COMPLETED
      })
    })

    test('should throw AcceptDonationRequestError when status update fails', async() => {
      // Arrange
      const acceptDonationService = new AcceptDonationService(
        mockAcceptDonationRepository,
        mockLogger
      )
      mockAcceptDonationRepository.update.mockRejectedValue(new Error('Update failed'))

      // Act & Assert
      await expect(
        acceptDonationService.updateAcceptanceRecordStatus(
          'seeker123',
          'req123',
          'donor123',
          AcceptDonationStatus.COMPLETED
        )
      ).rejects.toThrow(AcceptDonationRequestError)
    })
  })

  describe('getAcceptanceRecord', () => {
    test('should retrieve acceptance record', async() => {
      // Arrange
      const acceptDonationService = new AcceptDonationService(
        mockAcceptDonationRepository,
        mockLogger
      )
      const expectedRecord: AcceptDonationDTO = {
        donorId: 'donor123',
        seekerId: 'seeker123',
        requestPostId: 'req123',
        createdAt: '2024-01-01T00:00:00Z',
        status: AcceptDonationStatus.ACCEPTED,
        donorName: 'Donor Name',
        phoneNumbers: ['+8801234567890'],
        acceptanceTime: '2024-01-01T01:00:00Z'
      }
      mockAcceptDonationRepository.getAcceptedRequest.mockResolvedValue(expectedRecord)

      // Act
      const result = await acceptDonationService.getAcceptanceRecord(
        'seeker123',
        'req123',
        'donor123'
      )

      // Assert
      expect(result).toEqual(expectedRecord)
      expect(mockAcceptDonationRepository.getAcceptedRequest).toHaveBeenCalledWith(
        'seeker123',
        'req123',
        'donor123'
      )
    })

    test('should return null when record does not exist', async() => {
      // Arrange
      const acceptDonationService = new AcceptDonationService(
        mockAcceptDonationRepository,
        mockLogger
      )
      mockAcceptDonationRepository.getAcceptedRequest.mockResolvedValue(null)

      // Act
      const result = await acceptDonationService.getAcceptanceRecord(
        'seeker123',
        'req123',
        'donor123'
      )

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('getAcceptedDonorList', () => {
    test('should return list of accepted donors', async() => {
      // Arrange
      const acceptDonationService = new AcceptDonationService(
        mockAcceptDonationRepository,
        mockLogger
      )
      const expectedDonors: AcceptDonationDTO[] = [
        {
          donorId: 'donor1',
          seekerId: 'seeker123',
          requestPostId: 'req123',
          createdAt: '2024-01-01T00:00:00Z',
          status: AcceptDonationStatus.ACCEPTED,
          donorName: 'Donor 1',
          phoneNumbers: ['+8801111111111'],
          acceptanceTime: '2024-01-01T01:00:00Z'
        },
        {
          donorId: 'donor2',
          seekerId: 'seeker123',
          requestPostId: 'req123',
          createdAt: '2024-01-01T00:00:00Z',
          status: AcceptDonationStatus.ACCEPTED,
          donorName: 'Donor 2',
          phoneNumbers: ['+8802222222222'],
          acceptanceTime: '2024-01-01T02:00:00Z'
        }
      ]
      mockAcceptDonationRepository.queryAcceptedRequests.mockResolvedValue(expectedDonors)

      // Act
      const result = await acceptDonationService.getAcceptedDonorList('seeker123', 'req123')

      // Assert
      expect(result).toEqual(expectedDonors)
      expect(mockAcceptDonationRepository.queryAcceptedRequests).toHaveBeenCalledWith(
        'seeker123',
        'req123'
      )
    })

    test('should return empty array when no donors found', async() => {
      // Arrange
      const acceptDonationService = new AcceptDonationService(
        mockAcceptDonationRepository,
        mockLogger
      )
      mockAcceptDonationRepository.queryAcceptedRequests.mockResolvedValue(null)

      // Act
      const result = await acceptDonationService.getAcceptedDonorList('seeker123', 'req123')

      // Assert
      expect(result).toEqual([])
    })
  })

  describe('getRemainingBagsNeeded', () => {
    test('should calculate remaining bags needed correctly', async() => {
      // Arrange
      const acceptDonationService = new AcceptDonationService(
        mockAcceptDonationRepository,
        mockLogger
      )
      const acceptedDonors: AcceptDonationDTO[] = Array(2).fill({
        donorId: 'donor1',
        seekerId: 'seeker123',
        requestPostId: 'req123',
        createdAt: '2024-01-01T00:00:00Z',
        status: AcceptDonationStatus.ACCEPTED,
        donorName: 'Donor',
        phoneNumbers: ['+8801234567890'],
        acceptanceTime: '2024-01-01T01:00:00Z'
      })
      mockAcceptDonationRepository.queryAcceptedRequests.mockResolvedValue(acceptedDonors)

      // Act
      const result = await acceptDonationService.getRemainingBagsNeeded('seeker123', 'req123', 5)

      // Assert
      expect(result).toBe(3) // 5 - 2 = 3
    })

    test('should return 0 when all bags are covered', async() => {
      // Arrange
      const acceptDonationService = new AcceptDonationService(
        mockAcceptDonationRepository,
        mockLogger
      )
      const acceptedDonors: AcceptDonationDTO[] = Array(5).fill({
        donorId: 'donor1',
        seekerId: 'seeker123',
        requestPostId: 'req123',
        createdAt: '2024-01-01T00:00:00Z',
        status: AcceptDonationStatus.ACCEPTED,
        donorName: 'Donor',
        phoneNumbers: ['+8801234567890'],
        acceptanceTime: '2024-01-01T01:00:00Z'
      })
      mockAcceptDonationRepository.queryAcceptedRequests.mockResolvedValue(acceptedDonors)

      // Act
      const result = await acceptDonationService.getRemainingBagsNeeded('seeker123', 'req123', 3)

      // Assert
      expect(result).toBe(0) // max(0, 3 - 5) = 0
    })
  })

  describe('isAlreadyDonated', () => {
    test('should return true when status is COMPLETED', () => {
      // Arrange
      const acceptDonationService = new AcceptDonationService(
        mockAcceptDonationRepository,
        mockLogger
      )
      const completedRecord: AcceptDonationDTO = {
        donorId: 'donor123',
        seekerId: 'seeker123',
        requestPostId: 'req123',
        createdAt: '2024-01-01T00:00:00Z',
        status: AcceptDonationStatus.COMPLETED,
        donorName: 'Donor Name',
        phoneNumbers: ['+8801234567890'],
        acceptanceTime: '2024-01-01T01:00:00Z'
      }

      // Act
      const result = acceptDonationService.isAlreadyDonated(completedRecord)

      // Assert
      expect(result).toBe(true)
    })

    test('should return false when status is not COMPLETED', () => {
      // Arrange
      const acceptDonationService = new AcceptDonationService(
        mockAcceptDonationRepository,
        mockLogger
      )
      const acceptedRecord: AcceptDonationDTO = {
        donorId: 'donor123',
        seekerId: 'seeker123',
        requestPostId: 'req123',
        createdAt: '2024-01-01T00:00:00Z',
        status: AcceptDonationStatus.ACCEPTED,
        donorName: 'Donor Name',
        phoneNumbers: ['+8801234567890'],
        acceptanceTime: '2024-01-01T01:00:00Z'
      }

      // Act
      const result = acceptDonationService.isAlreadyDonated(acceptedRecord)

      // Assert
      expect(result).toBe(false)
    })

    test('should return false when record is null', () => {
      // Arrange
      const acceptDonationService = new AcceptDonationService(
        mockAcceptDonationRepository,
        mockLogger
      )

      // Act
      const result = acceptDonationService.isAlreadyDonated(null)

      // Assert
      expect(result).toBe(false)
    })
  })

  describe('sendNotificationToSeeker', () => {
    test('should send acceptance notification to seeker', async() => {
      // Arrange
      const acceptDonationService = new AcceptDonationService(
        mockAcceptDonationRepository,
        mockLogger
      )
      mockAcceptDonationRepository.queryAcceptedRequests.mockResolvedValue([])

      // Act
      await acceptDonationService.sendNotificationToSeeker(
        mockNotificationService,
        mockQueueModel,
        notificationQueueUrl,
        'seeker123',
        'req123',
        mockDonationPost,
        'donor123',
        '2024-01-01T00:00:00Z',
        AcceptDonationStatus.ACCEPTED,
        mockDonorProfile
      )

      // Assert
      expect(mockNotificationService.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'seeker123',
          title: 'Donor Found',
          type: NotificationType.REQ_ACCEPTED,
          status: AcceptDonationStatus.ACCEPTED,
          payload: expect.objectContaining({
            donorId: 'donor123',
            seekerId: 'seeker123',
            requestPostId: 'req123'
          })
        }),
        mockQueueModel,
        notificationQueueUrl
      )
    })

    test('should send ignored notification to seeker', async() => {
      // Arrange
      const acceptDonationService = new AcceptDonationService(
        mockAcceptDonationRepository,
        mockLogger
      )
      mockAcceptDonationRepository.queryAcceptedRequests.mockResolvedValue([])

      // Act
      await acceptDonationService.sendNotificationToSeeker(
        mockNotificationService,
        mockQueueModel,
        notificationQueueUrl,
        'seeker123',
        'req123',
        mockDonationPost,
        'donor123',
        '2024-01-01T00:00:00Z',
        AcceptDonationStatus.IGNORED,
        mockDonorProfile
      )

      // Assert
      expect(mockNotificationService.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'seeker123',
          title: 'Donor Ignored',
          type: NotificationType.REQ_IGNORED,
          body: 'request was ignored by donor'
        }),
        mockQueueModel,
        notificationQueueUrl
      )
    })
  })

  describe('updateDonationNotification', () => {
    test('should create notification when it does not exist and status is ACCEPTED', async() => {
      // Arrange
      const acceptDonationService = new AcceptDonationService(
        mockAcceptDonationRepository,
        mockLogger
      )
      mockNotificationService.getBloodDonationNotification.mockResolvedValue(null)

      // Act
      await acceptDonationService.updateDonationNotification(
        mockNotificationService,
        'donor123',
        'req123',
        'seeker123',
        '2024-01-01T00:00:00Z',
        AcceptDonationStatus.ACCEPTED,
        mockDonationPost,
        mockSeekerProfile
      )

      // Assert
      expect(mockNotificationService.createBloodDonationNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: NotificationType.BLOOD_REQ_POST,
          userId: 'donor123',
          status: AcceptDonationStatus.ACCEPTED,
          title: 'Blood Request Accepted'
        })
      )
    })

    test('should update notification when it exists', async() => {
      // Arrange
      const acceptDonationService = new AcceptDonationService(
        mockAcceptDonationRepository,
        mockLogger
      )
      mockNotificationService.getBloodDonationNotification.mockResolvedValue({
        id: 'req123',
        userId: 'donor123',
        type: NotificationType.BLOOD_REQ_POST,
        status: AcceptDonationStatus.PENDING,
        title: 'Blood Request',
        body: 'A+ blood needed',
        payload: {},
        createdAt: '2024-01-01T00:00:00Z'
      })

      // Act
      await acceptDonationService.updateDonationNotification(
        mockNotificationService,
        'donor123',
        'req123',
        'seeker123',
        '2024-01-01T00:00:00Z',
        AcceptDonationStatus.ACCEPTED,
        mockDonationPost,
        mockSeekerProfile
      )

      // Assert
      expect(mockNotificationService.updateBloodDonationNotificationStatus).toHaveBeenCalledWith(
        'donor123',
        'req123',
        NotificationType.BLOOD_REQ_POST,
        AcceptDonationStatus.ACCEPTED
      )
    })

    test('should not create notification when status is IGNORED and notification does not exist', async() => {
      // Arrange
      const acceptDonationService = new AcceptDonationService(
        mockAcceptDonationRepository,
        mockLogger
      )
      mockNotificationService.getBloodDonationNotification.mockResolvedValue(null)

      // Act
      await acceptDonationService.updateDonationNotification(
        mockNotificationService,
        'donor123',
        'req123',
        'seeker123',
        '2024-01-01T00:00:00Z',
        AcceptDonationStatus.IGNORED,
        mockDonationPost,
        mockSeekerProfile
      )

      // Assert
      expect(mockNotificationService.createBloodDonationNotification).not.toHaveBeenCalled()
      expect(mockNotificationService.updateBloodDonationNotificationStatus).not.toHaveBeenCalled()
    })
  })
})
