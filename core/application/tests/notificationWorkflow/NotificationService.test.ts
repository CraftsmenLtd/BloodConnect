import { NotificationService } from '../../notificationWorkflow/NotificationService'
import { generateUniqueID } from '../../utils/idGenerator'
import { getBloodRequestMessage } from '../../bloodDonationWorkflow/BloodDonationMessages'
import type { NotificationDTO, DonationNotificationDTO } from '../../../../commons/dto/NotificationDTO'
import { NotificationType } from '../../../../commons/dto/NotificationDTO'
import type { SNSModel } from '../../models/sns/SNSModel'
import type { UserService } from '../../userWorkflow/UserService'
import type { QueueModel } from '../../models/queue/QueueModel'
import type { LocalCacheMapManager } from '../../utils/localCacheMapManager'
import { mockLogger } from '../mocks/mockLogger'
import { AcceptDonationStatus, UrgencyLevel } from '../../../../commons/dto/DonationDTO'
import type NotificationRepository from '../../models/policies/repositories/NotificationRepository'
import type { NotificationAttributes, DonationNotificationAttributes } from '../../notificationWorkflow/Types'

jest.mock('../../utils/idGenerator')
jest.mock('../../bloodDonationWorkflow/BloodDonationMessages')

const mockNotificationRepository = {
  create: jest.fn(),
  update: jest.fn(),
  query: jest.fn(),
  queryBloodDonationNotifications: jest.fn(),
  getBloodDonationNotification: jest.fn()
} as unknown as jest.Mocked<NotificationRepository>

const mockSnsModel = {
  publish: jest.fn(),
  createPlatformEndpoint: jest.fn(),
  getEndpointAttributes: jest.fn(),
  setEndpointAttributes: jest.fn()
} as unknown as jest.Mocked<SNSModel>

const mockUserService = {
  getUser: jest.fn(),
  getDeviceSnsEndpointArn: jest.fn(),
  updateUserNotificationEndPoint: jest.fn()
} as unknown as jest.Mocked<UserService>

const mockQueueModel = {
  queue: jest.fn()
} as unknown as jest.Mocked<QueueModel>

const mockUserDeviceToSnsEndpointMap = {
  get: jest.fn(),
  set: jest.fn()
} as unknown as jest.Mocked<LocalCacheMapManager<string, string>>

describe('NotificationService', () => {
  let notificationService: NotificationService
  const notificationQueueUrl = 'https://sqs.us-east-1.amazonaws.com/123456789012/notification-queue'

  beforeEach(() => {
    jest.clearAllMocks()
    notificationService = new NotificationService(
      mockNotificationRepository,
      mockLogger
    );
    (generateUniqueID as jest.Mock).mockReturnValue('notification-123')
  })

  describe('sendPushNotification', () => {
    const mockNotificationAttributes: NotificationAttributes = {
      userId: 'user-123',
      title: 'Test Title',
      body: 'Test Message',
      type: NotificationType.COMMON,
      payload: {}
    }

    test('should send push notification successfully when user has cached endpoint', async () => {
      const cachedEndpoint = 'arn:aws:sns:us-east-1:123456789012:endpoint/GCM/MyApp/cached'
      mockUserDeviceToSnsEndpointMap.get.mockReturnValue(cachedEndpoint)
      mockSnsModel.publish.mockResolvedValue({ MessageId: 'msg-123' })
      mockNotificationRepository.create.mockResolvedValue({} as NotificationDTO)

      await notificationService.sendPushNotification(
        mockNotificationAttributes,
        'user-123',
        mockUserService,
        mockUserDeviceToSnsEndpointMap,
        mockSnsModel
      )

      expect(mockUserDeviceToSnsEndpointMap.get).toHaveBeenCalledWith('user-123')
      expect(mockSnsModel.publish).toHaveBeenCalledWith(
        mockNotificationAttributes,
        cachedEndpoint
      )
      expect(mockNotificationRepository.create).toHaveBeenCalled()
    })

    test('should fetch endpoint from user service when not cached', async () => {
      const userEndpoint = 'arn:aws:sns:us-east-1:123456789012:endpoint/GCM/MyApp/user'
      mockUserDeviceToSnsEndpointMap.get.mockReturnValue(undefined)
      mockUserService.getDeviceSnsEndpointArn.mockResolvedValue(userEndpoint)
      mockSnsModel.publish.mockResolvedValue({ MessageId: 'msg-123' })
      mockNotificationRepository.create.mockResolvedValue({} as NotificationDTO)

      await notificationService.sendPushNotification(
        mockNotificationAttributes,
        'user-123',
        mockUserService,
        mockUserDeviceToSnsEndpointMap,
        mockSnsModel
      )

      expect(mockUserService.getDeviceSnsEndpointArn).toHaveBeenCalledWith('user-123')
      expect(mockUserDeviceToSnsEndpointMap.set).toHaveBeenCalledWith('user-123', userEndpoint)
      expect(mockSnsModel.publish).toHaveBeenCalledWith(
        mockNotificationAttributes,
        userEndpoint
      )
    })

    test('should create blood donation notification for BLOOD_REQ_POST type', async () => {
      const cachedEndpoint = 'arn:aws:sns:us-east-1:123456789012:endpoint/GCM/MyApp/cached'
      const bloodReqNotification: DonationNotificationAttributes = {
        userId: 'donor-123',
        title: 'Blood Request',
        body: 'You have a blood request',
        type: NotificationType.BLOOD_REQ_POST,
        status: AcceptDonationStatus.PENDING,
        payload: {
          seekerId: 'seeker-123',
          requestPostId: 'request-123',
          createdAt: '2023-09-16T12:00:00.000Z',
          locationId: 'location-123',
          distance: 5,
          seekerName: 'Seeker Name',
          patientName: 'Patient Name',
          requestedBloodGroup: 'A+',
          bloodQuantity: 2,
          urgencyLevel: UrgencyLevel.URGENT,
          location: 'Dhaka',
          contactNumber: '+8801234567890',
          transportationInfo: 'Available',
          shortDescription: 'Urgent need',
          donationDateTime: '2023-09-20T12:00:00.000Z'
        }
      }

      mockUserDeviceToSnsEndpointMap.get.mockReturnValue(cachedEndpoint)
      mockNotificationRepository.getBloodDonationNotification.mockResolvedValue(null)
      mockNotificationRepository.create.mockResolvedValue({} as DonationNotificationDTO)
      mockSnsModel.publish.mockResolvedValue({ MessageId: 'msg-123' })

      await notificationService.sendPushNotification(
        bloodReqNotification,
        'donor-123',
        mockUserService,
        mockUserDeviceToSnsEndpointMap,
        mockSnsModel
      )

      expect(mockNotificationRepository.getBloodDonationNotification).toHaveBeenCalledWith(
        'donor-123',
        'request-123',
        NotificationType.BLOOD_REQ_POST
      )
      expect(mockNotificationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'donor-123',
          type: NotificationType.BLOOD_REQ_POST,
          status: AcceptDonationStatus.PENDING,
          id: 'request-123',
          payload: expect.objectContaining({
            seekerId: 'seeker-123',
            requestPostId: 'request-123'
          })
        })
      )
      expect(mockSnsModel.publish).toHaveBeenCalled()
    })

    test('should not create duplicate blood donation notification if already exists', async () => {
      const cachedEndpoint = 'arn:aws:sns:us-east-1:123456789012:endpoint/GCM/MyApp/cached'
      const bloodReqNotification: DonationNotificationAttributes = {
        userId: 'donor-123',
        title: 'Blood Request',
        body: 'You have a blood request',
        type: NotificationType.BLOOD_REQ_POST,
        status: AcceptDonationStatus.PENDING,
        payload: {
          seekerId: 'seeker-123',
          requestPostId: 'request-123',
          createdAt: '2023-09-16T12:00:00.000Z',
          locationId: 'location-123',
          distance: 5,
          seekerName: 'Seeker Name',
          patientName: 'Patient Name',
          requestedBloodGroup: 'A+',
          bloodQuantity: 2,
          urgencyLevel: UrgencyLevel.URGENT,
          location: 'Dhaka',
          contactNumber: '+8801234567890',
          transportationInfo: 'Available',
          shortDescription: 'Urgent need',
          donationDateTime: '2023-09-20T12:00:00.000Z'
        }
      }

      const existingNotification = {
        id: 'request-123',
        userId: 'donor-123',
        type: NotificationType.BLOOD_REQ_POST
      } as DonationNotificationDTO

      mockUserDeviceToSnsEndpointMap.get.mockReturnValue(cachedEndpoint)
      mockNotificationRepository.getBloodDonationNotification.mockResolvedValue(existingNotification)

      await notificationService.sendPushNotification(
        bloodReqNotification,
        'donor-123',
        mockUserService,
        mockUserDeviceToSnsEndpointMap,
        mockSnsModel
      )

      expect(mockNotificationRepository.create).not.toHaveBeenCalled()
      expect(mockSnsModel.publish).not.toHaveBeenCalled()
    })

    test('should create notification for REQ_ACCEPTED type', async () => {
      const cachedEndpoint = 'arn:aws:sns:us-east-1:123456789012:endpoint/GCM/MyApp/cached'
      const reqAcceptedNotification: DonationNotificationAttributes = {
        userId: 'seeker-123',
        title: 'Request Accepted',
        body: 'Donor accepted your request',
        type: NotificationType.REQ_ACCEPTED,
        status: AcceptDonationStatus.ACCEPTED,
        payload: {
          seekerId: 'seeker-123',
          requestPostId: 'request-123',
          createdAt: '2023-09-16T12:00:00.000Z',
          requestedBloodGroup: 'A+',
          bloodQuantity: 2,
          urgencyLevel: UrgencyLevel.URGENT,
          location: 'Dhaka',
          shortDescription: 'Urgent need',
          donationDateTime: '2023-09-20T12:00:00.000Z',
          donorId: 'donor-123',
          donorName: 'Donor Name',
          phoneNumbers: ['+8801234567890'],
          acceptedDonors: []
        }
      }

      mockUserDeviceToSnsEndpointMap.get.mockReturnValue(cachedEndpoint)
      mockNotificationRepository.create.mockResolvedValue({} as DonationNotificationDTO)
      mockSnsModel.publish.mockResolvedValue({ MessageId: 'msg-123' })

      await notificationService.sendPushNotification(
        reqAcceptedNotification,
        'seeker-123',
        mockUserService,
        mockUserDeviceToSnsEndpointMap,
        mockSnsModel
      )

      expect(mockNotificationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'seeker-123',
          type: NotificationType.REQ_ACCEPTED,
          id: 'request-123',
          payload: expect.objectContaining({
            donorId: 'donor-123',
            donorName: 'Donor Name',
            phoneNumbers: ['+8801234567890']
          })
        })
      )
      expect(mockSnsModel.publish).toHaveBeenCalled()
    })

    test('should handle SNS publish errors', async () => {
      const cachedEndpoint = 'arn:aws:sns:us-east-1:123456789012:endpoint/GCM/MyApp/cached'
      mockUserDeviceToSnsEndpointMap.get.mockReturnValue(cachedEndpoint)
      mockNotificationRepository.create.mockResolvedValue({} as NotificationDTO)
      mockSnsModel.publish.mockRejectedValue(new Error('SNS publish failed'))

      await expect(
        notificationService.sendPushNotification(
          mockNotificationAttributes,
          'user-123',
          mockUserService,
          mockUserDeviceToSnsEndpointMap,
          mockSnsModel
        )
      ).rejects.toThrow('Failed to notify user')
    })
  })

  describe('getUserSnsEndpointArn', () => {
    test('should return cached endpoint if available', async () => {
      const cachedEndpoint = 'arn:aws:sns:us-east-1:123456789012:endpoint/GCM/MyApp/cached'
      mockUserDeviceToSnsEndpointMap.get.mockReturnValue(cachedEndpoint)

      const result = await notificationService['getUserSnsEndpointArn'](
        mockUserDeviceToSnsEndpointMap,
        'user-123',
        mockUserService
      )

      expect(result).toBe(cachedEndpoint)
      expect(mockUserService.getDeviceSnsEndpointArn).not.toHaveBeenCalled()
    })

    test('should fetch and cache endpoint from user service if not cached', async () => {
      const userEndpoint = 'arn:aws:sns:us-east-1:123456789012:endpoint/GCM/MyApp/user'
      mockUserDeviceToSnsEndpointMap.get.mockReturnValue(undefined)
      mockUserService.getDeviceSnsEndpointArn.mockResolvedValue(userEndpoint)

      const result = await notificationService['getUserSnsEndpointArn'](
        mockUserDeviceToSnsEndpointMap,
        'user-123',
        mockUserService
      )

      expect(result).toBe(userEndpoint)
      expect(mockUserService.getDeviceSnsEndpointArn).toHaveBeenCalledWith('user-123')
      expect(mockUserDeviceToSnsEndpointMap.set).toHaveBeenCalledWith('user-123', userEndpoint)
    })
  })

  describe('publishNotification', () => {
    test('should publish notification to SNS endpoint', async () => {
      const endpointArn = 'arn:aws:sns:us-east-1:123456789012:endpoint/GCM/MyApp/abc123'
      const notificationAttributes: NotificationAttributes = {
        userId: 'user-123',
        title: 'Test',
        body: 'Test Body',
        type: NotificationType.COMMON,
        payload: {}
      }

      mockSnsModel.publish.mockResolvedValue({ MessageId: 'msg-123' })

      await notificationService.publishNotification(
        notificationAttributes,
        endpointArn,
        mockSnsModel
      )

      expect(mockSnsModel.publish).toHaveBeenCalledWith(notificationAttributes, endpointArn)
    })

    test('should throw error on SNS publish failure', async () => {
      const endpointArn = 'arn:aws:sns:us-east-1:123456789012:endpoint/GCM/MyApp/abc123'
      const notificationAttributes: NotificationAttributes = {
        userId: 'user-123',
        title: 'Test',
        body: 'Test Body',
        type: NotificationType.COMMON,
        payload: {}
      }

      mockSnsModel.publish.mockRejectedValue(new Error('SNS error'))

      await expect(
        notificationService.publishNotification(
          notificationAttributes,
          endpointArn,
          mockSnsModel
        )
      ).rejects.toThrow('Failed to notify user')
    })
  })

  describe('createNotification', () => {
    test('should create notification record successfully', async () => {
      const notificationAttributes: NotificationAttributes = {
        userId: 'user-123',
        title: 'Test Notification',
        body: 'Test Body',
        type: NotificationType.COMMON,
        payload: {}
      }

      mockNotificationRepository.create.mockResolvedValue({} as NotificationDTO)

      await notificationService.createNotification(notificationAttributes)

      expect(mockNotificationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...notificationAttributes,
          id: 'notification-123',
          createdAt: expect.any(String)
        })
      )
    })

    test('should throw error on notification creation failure', async () => {
      const notificationAttributes: NotificationAttributes = {
        userId: 'user-123',
        title: 'Test',
        body: 'Test',
        type: NotificationType.COMMON,
        payload: {}
      }

      mockNotificationRepository.create.mockRejectedValue(new Error('Database error'))

      await expect(
        notificationService.createNotification(notificationAttributes)
      ).rejects.toThrow('Failed to create notification')
    })
  })

  describe('createBloodDonationNotification', () => {
    test('should create new blood donation notification when none exists', async () => {
      const notificationAttributes: DonationNotificationAttributes = {
        userId: 'donor-123',
        title: 'Blood Request',
        body: 'You have a blood request',
        type: NotificationType.BLOOD_REQ_POST,
        status: AcceptDonationStatus.PENDING,
        payload: {
          seekerId: 'seeker-123',
          requestPostId: 'request-123',
          createdAt: '2023-09-16T12:00:00.000Z',
          locationId: 'location-123',
          distance: 5,
          seekerName: 'Seeker Name',
          patientName: 'Patient Name',
          requestedBloodGroup: 'A+',
          bloodQuantity: 2,
          urgencyLevel: UrgencyLevel.URGENT,
          location: 'Dhaka',
          contactNumber: '+8801234567890',
          transportationInfo: 'Available',
          shortDescription: 'Urgent need',
          donationDateTime: '2023-09-20T12:00:00.000Z'
        }
      }

      mockNotificationRepository.getBloodDonationNotification.mockResolvedValue(null)
      mockNotificationRepository.create.mockResolvedValue({} as DonationNotificationDTO)

      await notificationService.createBloodDonationNotification(notificationAttributes)

      expect(mockNotificationRepository.getBloodDonationNotification).toHaveBeenCalledWith(
        'donor-123',
        'request-123',
        NotificationType.BLOOD_REQ_POST
      )
      expect(mockNotificationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'donor-123',
          type: NotificationType.BLOOD_REQ_POST,
          status: AcceptDonationStatus.PENDING,
          id: 'request-123',
          createdAt: expect.any(String)
        })
      )
    })

    test('should not create duplicate if notification already exists', async () => {
      const notificationAttributes: DonationNotificationAttributes = {
        userId: 'donor-123',
        title: 'Blood Request',
        body: 'You have a blood request',
        type: NotificationType.BLOOD_REQ_POST,
        status: AcceptDonationStatus.PENDING,
        payload: {
          seekerId: 'seeker-123',
          requestPostId: 'request-123',
          createdAt: '2023-09-16T12:00:00.000Z',
          locationId: 'location-123',
          distance: 5,
          seekerName: 'Seeker Name',
          patientName: 'Patient Name',
          requestedBloodGroup: 'A+',
          bloodQuantity: 2,
          urgencyLevel: UrgencyLevel.URGENT,
          location: 'Dhaka',
          contactNumber: '+8801234567890',
          transportationInfo: 'Available',
          shortDescription: 'Urgent need',
          donationDateTime: '2023-09-20T12:00:00.000Z'
        }
      }

      const existingNotification = {
        id: 'request-123',
        userId: 'donor-123'
      } as DonationNotificationDTO

      mockNotificationRepository.getBloodDonationNotification.mockResolvedValue(existingNotification)

      await notificationService.createBloodDonationNotification(notificationAttributes)

      expect(mockNotificationRepository.create).not.toHaveBeenCalled()
    })

    test('should create notification for REQ_ACCEPTED type', async () => {
      const notificationAttributes: DonationNotificationAttributes = {
        userId: 'seeker-123',
        title: 'Request Accepted',
        body: 'Donor accepted',
        type: NotificationType.REQ_ACCEPTED,
        status: AcceptDonationStatus.ACCEPTED,
        payload: {
          seekerId: 'seeker-123',
          requestPostId: 'request-123',
          createdAt: '2023-09-16T12:00:00.000Z',
          requestedBloodGroup: 'A+',
          bloodQuantity: 2,
          urgencyLevel: UrgencyLevel.URGENT,
          location: 'Dhaka',
          shortDescription: 'Urgent need',
          donationDateTime: '2023-09-20T12:00:00.000Z',
          donorId: 'donor-123',
          donorName: 'Donor Name',
          phoneNumbers: ['+8801234567890'],
          acceptedDonors: []
        }
      }

      mockNotificationRepository.create.mockResolvedValue({} as DonationNotificationDTO)

      await notificationService.createBloodDonationNotification(notificationAttributes)

      expect(mockNotificationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'seeker-123',
          type: NotificationType.REQ_ACCEPTED,
          id: 'request-123',
          createdAt: expect.any(String)
        })
      )
    })

    test('should handle notification creation errors', async () => {
      const notificationAttributes: DonationNotificationAttributes = {
        userId: 'donor-123',
        title: 'Blood Request',
        body: 'Test',
        type: NotificationType.BLOOD_REQ_POST,
        status: AcceptDonationStatus.PENDING,
        payload: {
          seekerId: 'seeker-123',
          requestPostId: 'request-123',
          createdAt: '2023-09-16T12:00:00.000Z',
          locationId: 'location-123',
          distance: 5,
          seekerName: 'Seeker Name',
          patientName: 'Patient Name',
          requestedBloodGroup: 'A+',
          bloodQuantity: 2,
          urgencyLevel: UrgencyLevel.URGENT,
          location: 'Dhaka',
          contactNumber: '+8801234567890',
          transportationInfo: 'Available',
          shortDescription: 'Urgent need',
          donationDateTime: '2023-09-20T12:00:00.000Z'
        }
      }

      mockNotificationRepository.getBloodDonationNotification.mockResolvedValue(null)
      mockNotificationRepository.create.mockRejectedValue(new Error('Database error'))

      await expect(
        notificationService.createBloodDonationNotification(notificationAttributes)
      ).rejects.toThrow('Failed to create notification')
    })
  })

  describe('getIgnoredDonorList', () => {
    test('should return list of ignored donors', async () => {
      const mockNotifications = [
        { userId: 'donor-1', status: AcceptDonationStatus.IGNORED },
        { userId: 'donor-2', status: AcceptDonationStatus.IGNORED }
      ] as DonationNotificationDTO[]

      mockNotificationRepository.queryBloodDonationNotifications.mockResolvedValue(mockNotifications)

      const result = await notificationService.getIgnoredDonorList('request-123')

      expect(mockNotificationRepository.queryBloodDonationNotifications).toHaveBeenCalledWith(
        'request-123',
        AcceptDonationStatus.IGNORED
      )
      expect(result).toEqual(mockNotifications)
      expect(result.length).toBe(2)
    })
  })

  describe('getRejectedDonorsCount', () => {
    test('should return count of rejected donors', async () => {
      const mockNotifications = [
        { userId: 'donor-1', status: AcceptDonationStatus.IGNORED },
        { userId: 'donor-2', status: AcceptDonationStatus.IGNORED },
        { userId: 'donor-3', status: AcceptDonationStatus.IGNORED }
      ] as DonationNotificationDTO[]

      mockNotificationRepository.queryBloodDonationNotifications.mockResolvedValue(mockNotifications)

      const result = await notificationService.getRejectedDonorsCount('request-123')

      expect(result).toBe(3)
    })

    test('should return 0 when no rejected donors', async () => {
      mockNotificationRepository.queryBloodDonationNotifications.mockResolvedValue([])

      const result = await notificationService.getRejectedDonorsCount('request-123')

      expect(result).toBe(0)
    })
  })

  describe('updateBloodDonationNotifications', () => {
    test('should update all notifications for a request post', async () => {
      const mockNotifications = [
        { id: 'request-123', userId: 'donor-1', type: NotificationType.BLOOD_REQ_POST, payload: {} },
        { id: 'request-123', userId: 'donor-2', type: NotificationType.BLOOD_REQ_POST, payload: {} }
      ] as DonationNotificationDTO[]

      const updatePayload = {
        urgencyLevel: UrgencyLevel.NORMAL,
        bloodQuantity: 3
      }

      mockNotificationRepository.queryBloodDonationNotifications.mockResolvedValue(mockNotifications)
      mockNotificationRepository.update.mockResolvedValue({} as DonationNotificationDTO)

      await notificationService.updateBloodDonationNotifications('request-123', updatePayload)

      expect(mockNotificationRepository.queryBloodDonationNotifications).toHaveBeenCalledWith('request-123')
      expect(mockNotificationRepository.update).toHaveBeenCalledTimes(2)
      expect(mockNotificationRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'request-123',
          userId: 'donor-1',
          type: NotificationType.BLOOD_REQ_POST,
          payload: expect.objectContaining(updatePayload)
        })
      )
    })

    test('should throw error if notifications do not exist', async () => {
      mockNotificationRepository.queryBloodDonationNotifications.mockResolvedValue(null)

      await expect(
        notificationService.updateBloodDonationNotifications('request-123', {})
      ).rejects.toThrow('Notifications does not exist')
    })

    test('should handle update errors', async () => {
      const mockNotifications = [
        { id: 'request-123', userId: 'donor-1', type: NotificationType.BLOOD_REQ_POST, payload: {} }
      ] as DonationNotificationDTO[]

      mockNotificationRepository.queryBloodDonationNotifications.mockResolvedValue(mockNotifications)
      mockNotificationRepository.update.mockRejectedValue(new Error('Update failed'))

      await expect(
        notificationService.updateBloodDonationNotifications('request-123', {})
      ).rejects.toThrow('Failed to update notification')
    })
  })

  describe('updateBloodDonationNotificationStatus', () => {
    test('should update notification status successfully', async () => {
      mockNotificationRepository.update.mockResolvedValue({} as DonationNotificationDTO)

      await notificationService.updateBloodDonationNotificationStatus(
        'donor-123',
        'request-123',
        NotificationType.BLOOD_REQ_POST,
        AcceptDonationStatus.ACCEPTED
      )

      expect(mockNotificationRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'request-123',
          userId: 'donor-123',
          type: NotificationType.BLOOD_REQ_POST,
          status: AcceptDonationStatus.ACCEPTED
        })
      )
    })
  })

  describe('getBloodDonationNotification', () => {
    test('should retrieve blood donation notification', async () => {
      const mockNotification = {
        id: 'request-123',
        userId: 'donor-123',
        type: NotificationType.BLOOD_REQ_POST,
        status: AcceptDonationStatus.PENDING
      } as DonationNotificationDTO

      mockNotificationRepository.getBloodDonationNotification.mockResolvedValue(mockNotification)

      const result = await notificationService.getBloodDonationNotification(
        'donor-123',
        'request-123',
        NotificationType.BLOOD_REQ_POST
      )

      expect(mockNotificationRepository.getBloodDonationNotification).toHaveBeenCalledWith(
        'donor-123',
        'request-123',
        NotificationType.BLOOD_REQ_POST
      )
      expect(result).toEqual(mockNotification)
    })

    test('should return null when notification does not exist', async () => {
      mockNotificationRepository.getBloodDonationNotification.mockResolvedValue(null)

      const result = await notificationService.getBloodDonationNotification(
        'donor-123',
        'request-123',
        NotificationType.BLOOD_REQ_POST
      )

      expect(result).toBeNull()
    })
  })

  describe('storeDevice', () => {
    const mockRegistrationAttributes = {
      userId: 'user-123',
      deviceToken: 'device-token-xyz',
      platformApplicationArn: 'arn:aws:sns:us-east-1:123456789012:app/GCM/MyApp'
    }

    test('should store device and create SNS endpoint successfully', async () => {
      const endpointArn = 'arn:aws:sns:us-east-1:123456789012:endpoint/GCM/MyApp/abc123'
      const mockUser = { id: 'user-123', name: 'Test User' }

      mockSnsModel.createPlatformEndpoint.mockResolvedValue({ snsEndpointArn: endpointArn })
      mockUserService.getUser.mockResolvedValue(mockUser)
      mockUserService.updateUserNotificationEndPoint.mockResolvedValue(undefined)

      const result = await notificationService.storeDevice(
        mockRegistrationAttributes,
        mockUserService,
        mockSnsModel
      )

      expect(mockSnsModel.createPlatformEndpoint).toHaveBeenCalledWith(mockRegistrationAttributes)
      expect(mockUserService.getUser).toHaveBeenCalledWith('user-123')
      expect(mockUserService.updateUserNotificationEndPoint).toHaveBeenCalledWith('user-123', endpointArn)
      expect(result).toBe('Device registration successful.')
    })

    test('should throw error if endpoint ARN is empty', async () => {
      mockSnsModel.createPlatformEndpoint.mockResolvedValue({ snsEndpointArn: '' })

      await expect(
        notificationService.storeDevice(
          mockRegistrationAttributes,
          mockUserService,
          mockSnsModel
        )
      ).rejects.toThrow('Failed to store Endpoint ARN')
    })

    test('should throw error if user not found', async () => {
      const endpointArn = 'arn:aws:sns:us-east-1:123456789012:endpoint/GCM/MyApp/abc123'

      mockSnsModel.createPlatformEndpoint.mockResolvedValue({ snsEndpointArn: endpointArn })
      mockUserService.getUser.mockResolvedValue(null)

      await expect(
        notificationService.storeDevice(
          mockRegistrationAttributes,
          mockUserService,
          mockSnsModel
        )
      ).rejects.toThrow('Failed to store Endpoint ARN')
    })

    test('should handle existing endpoint and update it', async () => {
      const existingArn = 'arn:aws:sns:us-east-1:123456789012:endpoint/GCM/MyApp/existing'
      const error = new Error(
        `Invalid parameter: Token Reason: Endpoint ${existingArn} already exists`
      )
      error.name = 'InvalidParameterException'

      mockSnsModel.createPlatformEndpoint.mockRejectedValue(error)
      mockSnsModel.getEndpointAttributes.mockResolvedValue({
        CustomUserData: 'old-user-123',
        Enabled: 'true',
        Token: 'old-token'
      })
      mockSnsModel.setEndpointAttributes.mockResolvedValue({})
      mockUserService.updateUserNotificationEndPoint.mockResolvedValue(undefined)

      const result = await notificationService.storeDevice(
        mockRegistrationAttributes,
        mockUserService,
        mockSnsModel
      )

      expect(mockSnsModel.getEndpointAttributes).toHaveBeenCalledWith(existingArn)
      expect(mockUserService.updateUserNotificationEndPoint).toHaveBeenCalledWith('old-user-123', '')
      expect(mockSnsModel.setEndpointAttributes).toHaveBeenCalledWith(existingArn, mockRegistrationAttributes)
      expect(mockUserService.updateUserNotificationEndPoint).toHaveBeenCalledWith('user-123', existingArn)
      expect(result).toBe('Device registration successful with existing endpoint.')
    })

    test('should throw error for other exceptions', async () => {
      mockSnsModel.createPlatformEndpoint.mockRejectedValue(new Error('SNS error'))

      await expect(
        notificationService.storeDevice(
          mockRegistrationAttributes,
          mockUserService,
          mockSnsModel
        )
      ).rejects.toThrow('Failed to store Endpoint ARN')
    })
  })

  describe('handleExistingSnsEndpoint', () => {
    test('should handle existing endpoint and update user mappings', async () => {
      const existingArn = 'arn:aws:sns:us-east-1:123456789012:endpoint/GCM/MyApp/existing'
      const registrationAttributes = {
        userId: 'new-user-123',
        deviceToken: 'device-token-xyz',
        platformApplicationArn: 'arn:aws:sns:us-east-1:123456789012:app/GCM/MyApp'
      }

      mockSnsModel.getEndpointAttributes.mockResolvedValue({
        CustomUserData: 'old-user-123',
        Enabled: 'true',
        Token: 'old-token'
      })
      mockSnsModel.setEndpointAttributes.mockResolvedValue({})
      mockUserService.updateUserNotificationEndPoint.mockResolvedValue(undefined)

      const result = await notificationService['handleExistingSnsEndpoint'](
        mockSnsModel,
        mockUserService,
        existingArn,
        registrationAttributes
      )

      expect(mockSnsModel.getEndpointAttributes).toHaveBeenCalledWith(existingArn)
      expect(mockUserService.updateUserNotificationEndPoint).toHaveBeenCalledWith('old-user-123', '')
      expect(mockSnsModel.setEndpointAttributes).toHaveBeenCalledWith(existingArn, registrationAttributes)
      expect(mockUserService.updateUserNotificationEndPoint).toHaveBeenCalledWith('new-user-123', existingArn)
      expect(result).toBe('Device registration successful with existing endpoint.')
    })
  })

  describe('sendNotification', () => {
    test('should queue notification for processing', async () => {
      const notificationAttributes: NotificationAttributes = {
        userId: 'user-123',
        title: 'Test Notification',
        body: 'Test Body',
        type: NotificationType.COMMON,
        payload: {}
      }

      mockQueueModel.queue.mockResolvedValue(undefined)

      await notificationService.sendNotification(
        notificationAttributes,
        mockQueueModel,
        notificationQueueUrl
      )

      expect(mockQueueModel.queue).toHaveBeenCalledWith(
        notificationAttributes,
        notificationQueueUrl
      )
    })
  })

  describe('sendRequestNotification', () => {
    const mockDonationAttributes = {
      seekerId: 'seeker-123',
      seekerName: 'Seeker Name',
      patientName: 'Patient Name',
      requestPostId: 'request-123',
      createdAt: '2023-09-16T12:00:00.000Z',
      requestedBloodGroup: 'A+',
      bloodQuantity: 2,
      urgencyLevel: UrgencyLevel.URGENT,
      location: 'Dhaka',
      contactNumber: '+8801234567890',
      transportationInfo: 'Available',
      shortDescription: 'Urgent need',
      donationDateTime: '2023-09-20T12:00:00.000Z'
    }

    const mockEligibleDonors = {
      'donor-1': {
        locationId: 'location-1',
        distance: 5
      },
      'donor-2': {
        locationId: 'location-2',
        distance: 10
      }
    }

    test('should send request notifications to all eligible donors', async () => {
      (getBloodRequestMessage as jest.Mock).mockReturnValue('Urgent A+ blood needed | Urgent need')
      mockQueueModel.queue.mockResolvedValue(undefined)

      await notificationService.sendRequestNotification(
        mockDonationAttributes,
        mockEligibleDonors,
        mockQueueModel,
        notificationQueueUrl
      )

      expect(getBloodRequestMessage).toHaveBeenCalledWith(
        UrgencyLevel.URGENT,
        'A+',
        'Urgent need'
      )
      expect(mockQueueModel.queue).toHaveBeenCalledTimes(2)
      expect(mockQueueModel.queue).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'donor-1',
          title: 'Blood Request',
          body: 'Urgent A+ blood needed | Urgent need',
          type: NotificationType.BLOOD_REQ_POST,
          status: AcceptDonationStatus.PENDING,
          payload: expect.objectContaining({
            seekerId: 'seeker-123',
            requestPostId: 'request-123',
            locationId: 'location-1',
            distance: 5
          })
        }),
        notificationQueueUrl
      )
    })

    test('should handle empty eligible donors list', async () => {
      await notificationService.sendRequestNotification(
        mockDonationAttributes,
        {},
        mockQueueModel,
        notificationQueueUrl
      )

      expect(mockQueueModel.queue).not.toHaveBeenCalled()
    })
  })
})
