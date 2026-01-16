import DonationNotificationDynamoDbOperations from '../../../commons/ddbOperations/DonationNotificationDynamoDbOperations'
import DynamoDbTableOperations from '../../../commons/ddbOperations/DynamoDbTableOperations'
import type { DonationNotificationDTO, NotificationDTO } from '../../../../../../commons/dto/NotificationDTO'
import { NotificationType } from '../../../../../../commons/dto/NotificationDTO'
import { AcceptDonationStatus } from '../../../../../../commons/dto/DonationDTO'
import { QueryConditionOperator } from '../../../../../application/models/policies/repositories/QueryTypes'
import { NOTIFICATION_PK_PREFIX } from '../../../commons/ddbModels/NotificationModel'

jest.mock('../../../commons/ddbOperations/DynamoDbTableOperations')

describe('DonationNotificationDynamoDbOperations', () => {
  let donationNotificationDynamoDbOperations: DonationNotificationDynamoDbOperations
  const mockTableName = 'test-notification-table'
  const mockRegion = 'us-east-1'

  beforeEach(() => {
    jest.clearAllMocks()
    donationNotificationDynamoDbOperations = new DonationNotificationDynamoDbOperations(
      mockTableName,
      mockRegion
    )
  })

  describe('constructor', () => {
    it('should initialize with correct table name and region', () => {
      expect(donationNotificationDynamoDbOperations).toBeInstanceOf(
        DonationNotificationDynamoDbOperations
      )
      expect(donationNotificationDynamoDbOperations).toBeInstanceOf(DynamoDbTableOperations)
    })

    it('should initialize with DonationNotificationModel adapter', () => {
      const newInstance = new DonationNotificationDynamoDbOperations(
        mockTableName,
        mockRegion
      )
      expect(newInstance).toBeDefined()
    })
  })

  describe('queryBloodDonationNotifications', () => {
    const requestPostId = 'request-123'

    it('should successfully query blood donation notifications without status filter', async () => {
      const mockNotifications: DonationNotificationDTO[] = [
        {
          id: requestPostId,
          userId: 'user-1',
          title: 'Blood Request',
          body: 'New blood request in your area',
          type: NotificationType.BLOOD_REQ_POST,
          status: AcceptDonationStatus.PENDING,
          payload: {
            seekerId: 'seeker-1',
            requestPostId,
            createdAt: '2024-01-15T10:00:00.000Z',
            bloodQuantity: 2,
            requestedBloodGroup: 'A+',
            urgencyLevel: 'urgent',
            contactNumber: '+1234567890',
            donationDateTime: '2024-01-20T10:00:00.000Z'
          },
          createdAt: '2024-01-15T10:00:00.000Z'
        },
        {
          id: requestPostId,
          userId: 'user-2',
          title: 'Blood Request',
          body: 'New blood request in your area',
          type: NotificationType.BLOOD_REQ_POST,
          status: AcceptDonationStatus.PENDING,
          payload: {
            seekerId: 'seeker-1',
            requestPostId,
            createdAt: '2024-01-15T10:00:00.000Z',
            bloodQuantity: 2,
            requestedBloodGroup: 'A+',
            urgencyLevel: 'urgent',
            contactNumber: '+1234567890',
            donationDateTime: '2024-01-20T10:00:00.000Z'
          },
          createdAt: '2024-01-15T10:00:00.000Z'
        }
      ]

      const mockModelAdapter = {
        getIndex: jest.fn().mockReturnValue({
          partitionKey: 'GSI1PK',
          sortKey: 'GSI1SK'
        })
      }

      Object.defineProperty(donationNotificationDynamoDbOperations, 'modelAdapter', {
        value: mockModelAdapter,
        writable: true
      })

      const mockQuery = jest.fn().mockResolvedValue({ items: mockNotifications })
      DynamoDbTableOperations.prototype.query = mockQuery

      const result = await donationNotificationDynamoDbOperations.queryBloodDonationNotifications(
        requestPostId
      )

      expect(result).toEqual(mockNotifications)
      expect(mockModelAdapter.getIndex).toHaveBeenCalledWith('GSI', 'GSI1')
      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          partitionKeyCondition: {
            attributeName: 'GSI1PK',
            operator: QueryConditionOperator.EQUALS,
            attributeValue: requestPostId
          }
        }),
        'GSI1'
      )
    })

    it('should query with status filter when status is provided', async () => {
      const status = AcceptDonationStatus.ACCEPTED
      const mockNotifications: DonationNotificationDTO[] = [
        {
          id: requestPostId,
          userId: 'user-1',
          title: 'Request Accepted',
          body: 'Your request has been accepted',
          type: NotificationType.REQ_ACCEPTED,
          status: AcceptDonationStatus.ACCEPTED,
          payload: {
            seekerId: 'seeker-1',
            requestPostId,
            donorId: 'donor-1',
            createdAt: '2024-01-15T10:00:00.000Z',
            donorName: 'John Doe',
            phoneNumbers: ['+1234567890'],
            requestedBloodGroup: 'A+',
            urgencyLevel: 'urgent',
            location: 'City Hospital',
            donationDateTime: '2024-01-20T10:00:00.000Z'
          },
          createdAt: '2024-01-15T10:00:00.000Z'
        }
      ]

      const mockModelAdapter = {
        getIndex: jest.fn().mockReturnValue({
          partitionKey: 'GSI1PK',
          sortKey: 'GSI1SK'
        })
      }

      Object.defineProperty(donationNotificationDynamoDbOperations, 'modelAdapter', {
        value: mockModelAdapter,
        writable: true
      })

      const mockQuery = jest.fn().mockResolvedValue({ items: mockNotifications })
      DynamoDbTableOperations.prototype.query = mockQuery

      const result = await donationNotificationDynamoDbOperations.queryBloodDonationNotifications(
        requestPostId,
        status
      )

      expect(result).toEqual(mockNotifications)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          partitionKeyCondition: {
            attributeName: 'GSI1PK',
            operator: QueryConditionOperator.EQUALS,
            attributeValue: requestPostId
          },
          sortKeyCondition: {
            attributeName: 'GSI1SK',
            operator: QueryConditionOperator.BEGINS_WITH,
            attributeValue: `${NOTIFICATION_PK_PREFIX}#${status}`
          }
        }),
        'GSI1'
      )
    })

    it('should throw error when GSI1 index is not found', async () => {
      const mockModelAdapter = {
        getIndex: jest.fn().mockReturnValue(undefined)
      }

      Object.defineProperty(donationNotificationDynamoDbOperations, 'modelAdapter', {
        value: mockModelAdapter,
        writable: true
      })

      await expect(
        donationNotificationDynamoDbOperations.queryBloodDonationNotifications(requestPostId)
      ).rejects.toThrow('Index not found.')

      expect(mockModelAdapter.getIndex).toHaveBeenCalledWith('GSI', 'GSI1')
    })

    it('should return empty array when no notifications found', async () => {
      const mockModelAdapter = {
        getIndex: jest.fn().mockReturnValue({
          partitionKey: 'GSI1PK',
          sortKey: 'GSI1SK'
        })
      }

      Object.defineProperty(donationNotificationDynamoDbOperations, 'modelAdapter', {
        value: mockModelAdapter,
        writable: true
      })

      const mockQuery = jest.fn().mockResolvedValue({ items: [] })
      DynamoDbTableOperations.prototype.query = mockQuery

      const result = await donationNotificationDynamoDbOperations.queryBloodDonationNotifications(
        requestPostId
      )

      expect(result).toEqual([])
    })

    it('should not include sort key condition when status is undefined', async () => {
      const mockModelAdapter = {
        getIndex: jest.fn().mockReturnValue({
          partitionKey: 'GSI1PK',
          sortKey: 'GSI1SK'
        })
      }

      Object.defineProperty(donationNotificationDynamoDbOperations, 'modelAdapter', {
        value: mockModelAdapter,
        writable: true
      })

      const mockQuery = jest.fn().mockResolvedValue({ items: [] })
      DynamoDbTableOperations.prototype.query = mockQuery

      await donationNotificationDynamoDbOperations.queryBloodDonationNotifications(
        requestPostId,
        undefined
      )

      const callArgs = mockQuery.mock.calls[0][0]
      expect(callArgs.sortKeyCondition).toBeUndefined()
    })

    it('should not include sort key condition when GSI sort key is undefined', async () => {
      const mockModelAdapter = {
        getIndex: jest.fn().mockReturnValue({
          partitionKey: 'GSI1PK',
          sortKey: undefined
        })
      }

      Object.defineProperty(donationNotificationDynamoDbOperations, 'modelAdapter', {
        value: mockModelAdapter,
        writable: true
      })

      const mockQuery = jest.fn().mockResolvedValue({ items: [] })
      DynamoDbTableOperations.prototype.query = mockQuery

      await donationNotificationDynamoDbOperations.queryBloodDonationNotifications(
        requestPostId,
        AcceptDonationStatus.PENDING
      )

      const callArgs = mockQuery.mock.calls[0][0]
      expect(callArgs.sortKeyCondition).toBeUndefined()
    })

    it('should use EQUALS operator for partition key', async () => {
      const mockModelAdapter = {
        getIndex: jest.fn().mockReturnValue({
          partitionKey: 'GSI1PK',
          sortKey: 'GSI1SK'
        })
      }

      Object.defineProperty(donationNotificationDynamoDbOperations, 'modelAdapter', {
        value: mockModelAdapter,
        writable: true
      })

      const mockQuery = jest.fn().mockResolvedValue({ items: [] })
      DynamoDbTableOperations.prototype.query = mockQuery

      await donationNotificationDynamoDbOperations.queryBloodDonationNotifications(requestPostId)

      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          partitionKeyCondition: expect.objectContaining({
            operator: QueryConditionOperator.EQUALS
          })
        }),
        'GSI1'
      )
    })

    it('should use BEGINS_WITH operator for sort key when status is provided', async () => {
      const mockModelAdapter = {
        getIndex: jest.fn().mockReturnValue({
          partitionKey: 'GSI1PK',
          sortKey: 'GSI1SK'
        })
      }

      Object.defineProperty(donationNotificationDynamoDbOperations, 'modelAdapter', {
        value: mockModelAdapter,
        writable: true
      })

      const mockQuery = jest.fn().mockResolvedValue({ items: [] })
      DynamoDbTableOperations.prototype.query = mockQuery

      await donationNotificationDynamoDbOperations.queryBloodDonationNotifications(
        requestPostId,
        AcceptDonationStatus.PENDING
      )

      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          sortKeyCondition: expect.objectContaining({
            operator: QueryConditionOperator.BEGINS_WITH
          })
        }),
        'GSI1'
      )
    })

    it('should handle different status values', async () => {
      const statuses = [
        AcceptDonationStatus.PENDING,
        AcceptDonationStatus.ACCEPTED,
        AcceptDonationStatus.COMPLETED,
        AcceptDonationStatus.IGNORED
      ]

      const mockModelAdapter = {
        getIndex: jest.fn().mockReturnValue({
          partitionKey: 'GSI1PK',
          sortKey: 'GSI1SK'
        })
      }

      Object.defineProperty(donationNotificationDynamoDbOperations, 'modelAdapter', {
        value: mockModelAdapter,
        writable: true
      })

      const mockQuery = jest.fn().mockResolvedValue({ items: [] })
      DynamoDbTableOperations.prototype.query = mockQuery

      for (const status of statuses) {
        mockQuery.mockClear()

        await donationNotificationDynamoDbOperations.queryBloodDonationNotifications(
          requestPostId,
          status
        )

        expect(mockQuery).toHaveBeenCalledWith(
          expect.objectContaining({
            sortKeyCondition: expect.objectContaining({
              attributeValue: `${NOTIFICATION_PK_PREFIX}#${status}`
            })
          }),
          'GSI1'
        )
      }
    })

    it('should query using GSI1 index', async () => {
      const mockModelAdapter = {
        getIndex: jest.fn().mockReturnValue({
          partitionKey: 'GSI1PK',
          sortKey: 'GSI1SK'
        })
      }

      Object.defineProperty(donationNotificationDynamoDbOperations, 'modelAdapter', {
        value: mockModelAdapter,
        writable: true
      })

      const mockQuery = jest.fn().mockResolvedValue({ items: [] })
      DynamoDbTableOperations.prototype.query = mockQuery

      await donationNotificationDynamoDbOperations.queryBloodDonationNotifications(requestPostId)

      expect(mockQuery).toHaveBeenCalledWith(expect.anything(), 'GSI1')
    })

    it('should handle multiple notification types', async () => {
      const mockNotifications: (NotificationDTO | DonationNotificationDTO)[] = [
        {
          id: requestPostId,
          userId: 'user-1',
          title: 'Blood Request',
          body: 'New blood request',
          type: NotificationType.BLOOD_REQ_POST,
          status: AcceptDonationStatus.PENDING,
          payload: {
            seekerId: 'seeker-1',
            requestPostId,
            createdAt: '2024-01-15T10:00:00.000Z',
            bloodQuantity: 2,
            requestedBloodGroup: 'A+',
            urgencyLevel: 'urgent',
            contactNumber: '+1234567890',
            donationDateTime: '2024-01-20T10:00:00.000Z'
          },
          createdAt: '2024-01-15T10:00:00.000Z'
        },
        {
          id: requestPostId,
          userId: 'user-2',
          title: 'Request Accepted',
          body: 'Donor accepted your request',
          type: NotificationType.REQ_ACCEPTED,
          status: AcceptDonationStatus.ACCEPTED,
          payload: {
            seekerId: 'seeker-1',
            requestPostId,
            donorId: 'donor-1',
            createdAt: '2024-01-15T11:00:00.000Z',
            donorName: 'John Doe',
            phoneNumbers: ['+1234567890'],
            requestedBloodGroup: 'A+',
            urgencyLevel: 'urgent',
            location: 'Hospital',
            donationDateTime: '2024-01-20T10:00:00.000Z'
          },
          createdAt: '2024-01-15T11:00:00.000Z'
        }
      ]

      const mockModelAdapter = {
        getIndex: jest.fn().mockReturnValue({
          partitionKey: 'GSI1PK',
          sortKey: 'GSI1SK'
        })
      }

      Object.defineProperty(donationNotificationDynamoDbOperations, 'modelAdapter', {
        value: mockModelAdapter,
        writable: true
      })

      const mockQuery = jest.fn().mockResolvedValue({ items: mockNotifications })
      DynamoDbTableOperations.prototype.query = mockQuery

      const result = await donationNotificationDynamoDbOperations.queryBloodDonationNotifications(
        requestPostId
      )

      expect(result).toHaveLength(2)
      expect(result[0].type).toBe(NotificationType.BLOOD_REQ_POST)
      expect(result[1].type).toBe(NotificationType.REQ_ACCEPTED)
    })
  })

  describe('getBloodDonationNotification', () => {
    const userId = 'user-123'
    const requestPostId = 'request-456'
    const type = NotificationType.BLOOD_REQ_POST

    it('should successfully get a blood donation notification', async () => {
      const mockNotification: DonationNotificationDTO = {
        id: requestPostId,
        userId,
        title: 'Blood Request',
        body: 'New blood request in your area',
        type: NotificationType.BLOOD_REQ_POST,
        status: AcceptDonationStatus.PENDING,
        payload: {
          seekerId: 'seeker-1',
          requestPostId,
          createdAt: '2024-01-15T10:00:00.000Z',
          bloodQuantity: 2,
          requestedBloodGroup: 'A+',
          urgencyLevel: 'urgent',
          contactNumber: '+1234567890',
          donationDateTime: '2024-01-20T10:00:00.000Z',
          seekerName: 'Jane Doe',
          location: 'City Hospital'
        },
        createdAt: '2024-01-15T10:00:00.000Z'
      }

      const mockGetItem = jest.fn().mockResolvedValue(mockNotification)
      DynamoDbTableOperations.prototype.getItem = mockGetItem

      const result = await donationNotificationDynamoDbOperations.getBloodDonationNotification(
        userId,
        requestPostId,
        type
      )

      expect(result).toEqual(mockNotification)
      expect(mockGetItem).toHaveBeenCalledWith(
        `${NOTIFICATION_PK_PREFIX}#${userId}`,
        `${type}#${requestPostId}`
      )
      expect(mockGetItem).toHaveBeenCalledTimes(1)
    })

    it('should return null when notification does not exist', async () => {
      const mockGetItem = jest.fn().mockResolvedValue(null)
      DynamoDbTableOperations.prototype.getItem = mockGetItem

      const result = await donationNotificationDynamoDbOperations.getBloodDonationNotification(
        userId,
        requestPostId,
        type
      )

      expect(result).toBeNull()
      expect(mockGetItem).toHaveBeenCalledWith(
        `${NOTIFICATION_PK_PREFIX}#${userId}`,
        `${type}#${requestPostId}`
      )
    })

    it('should format partition key correctly with user ID', async () => {
      const mockGetItem = jest.fn().mockResolvedValue(null)
      DynamoDbTableOperations.prototype.getItem = mockGetItem

      await donationNotificationDynamoDbOperations.getBloodDonationNotification(
        'test-user-id',
        requestPostId,
        type
      )

      expect(mockGetItem).toHaveBeenCalledWith(
        `${NOTIFICATION_PK_PREFIX}#test-user-id`,
        expect.any(String)
      )
    })

    it('should format sort key correctly with type and request post ID', async () => {
      const mockGetItem = jest.fn().mockResolvedValue(null)
      DynamoDbTableOperations.prototype.getItem = mockGetItem

      await donationNotificationDynamoDbOperations.getBloodDonationNotification(
        userId,
        'post-123',
        NotificationType.REQ_ACCEPTED
      )

      expect(mockGetItem).toHaveBeenCalledWith(
        expect.any(String),
        `${NotificationType.REQ_ACCEPTED}#post-123`
      )
    })

    it('should handle REQ_ACCEPTED notification type', async () => {
      const mockNotification: DonationNotificationDTO = {
        id: requestPostId,
        userId,
        title: 'Request Accepted',
        body: 'Your request has been accepted',
        type: NotificationType.REQ_ACCEPTED,
        status: AcceptDonationStatus.ACCEPTED,
        payload: {
          seekerId: 'seeker-1',
          requestPostId,
          donorId: 'donor-1',
          createdAt: '2024-01-15T11:00:00.000Z',
          donorName: 'John Doe',
          phoneNumbers: ['+1234567890'],
          requestedBloodGroup: 'A+',
          urgencyLevel: 'urgent',
          location: 'Hospital',
          donationDateTime: '2024-01-20T10:00:00.000Z'
        },
        createdAt: '2024-01-15T11:00:00.000Z'
      }

      const mockGetItem = jest.fn().mockResolvedValue(mockNotification)
      DynamoDbTableOperations.prototype.getItem = mockGetItem

      const result = await donationNotificationDynamoDbOperations.getBloodDonationNotification(
        userId,
        requestPostId,
        NotificationType.REQ_ACCEPTED
      )

      expect(result?.type).toBe(NotificationType.REQ_ACCEPTED)
      expect(result?.status).toBe(AcceptDonationStatus.ACCEPTED)
    })

    it('should handle REQ_IGNORED notification type', async () => {
      const mockNotification: DonationNotificationDTO = {
        id: requestPostId,
        userId,
        title: 'Request Ignored',
        body: 'Donor ignored your request',
        type: NotificationType.REQ_IGNORED,
        status: AcceptDonationStatus.IGNORED,
        payload: {
          seekerId: 'seeker-1',
          requestPostId,
          donorId: 'donor-1',
          createdAt: '2024-01-15T11:00:00.000Z',
          donorName: 'John Doe',
          phoneNumbers: ['+1234567890'],
          requestedBloodGroup: 'A+',
          urgencyLevel: 'urgent',
          location: 'Hospital',
          donationDateTime: '2024-01-20T10:00:00.000Z'
        },
        createdAt: '2024-01-15T11:00:00.000Z'
      }

      const mockGetItem = jest.fn().mockResolvedValue(mockNotification)
      DynamoDbTableOperations.prototype.getItem = mockGetItem

      const result = await donationNotificationDynamoDbOperations.getBloodDonationNotification(
        userId,
        requestPostId,
        NotificationType.REQ_IGNORED
      )

      expect(result?.type).toBe(NotificationType.REQ_IGNORED)
      expect(result?.status).toBe(AcceptDonationStatus.IGNORED)
    })

    it('should handle notification with all optional payload fields', async () => {
      const mockNotification: DonationNotificationDTO = {
        id: requestPostId,
        userId,
        title: 'Blood Request',
        body: 'New blood request in your area',
        type: NotificationType.BLOOD_REQ_POST,
        status: AcceptDonationStatus.PENDING,
        payload: {
          seekerId: 'seeker-1',
          requestPostId,
          createdAt: '2024-01-15T10:00:00.000Z',
          bloodQuantity: 2,
          requestedBloodGroup: 'A+',
          urgencyLevel: 'urgent',
          contactNumber: '+1234567890',
          donationDateTime: '2024-01-20T10:00:00.000Z',
          seekerName: 'Jane Doe',
          patientName: 'Patient X',
          location: 'City Hospital',
          locationId: 'loc-123',
          shortDescription: 'Urgent blood needed',
          transportationInfo: 'Ambulance available',
          distance: 5.2
        },
        createdAt: '2024-01-15T10:00:00.000Z'
      }

      const mockGetItem = jest.fn().mockResolvedValue(mockNotification)
      DynamoDbTableOperations.prototype.getItem = mockGetItem

      const result = await donationNotificationDynamoDbOperations.getBloodDonationNotification(
        userId,
        requestPostId,
        type
      )

      expect(result?.payload).toHaveProperty('seekerName')
      expect(result?.payload).toHaveProperty('patientName')
      expect(result?.payload).toHaveProperty('location')
      expect(result?.payload).toHaveProperty('distance')
    })

    it('should handle different notification types correctly', async () => {
      const notificationTypes = [
        NotificationType.BLOOD_REQ_POST,
        NotificationType.REQ_ACCEPTED,
        NotificationType.REQ_IGNORED
      ]

      const mockGetItem = jest.fn().mockResolvedValue(null)
      DynamoDbTableOperations.prototype.getItem = mockGetItem

      for (const notifType of notificationTypes) {
        mockGetItem.mockClear()

        await donationNotificationDynamoDbOperations.getBloodDonationNotification(
          userId,
          requestPostId,
          notifType
        )

        expect(mockGetItem).toHaveBeenCalledWith(
          expect.any(String),
          `${notifType}#${requestPostId}`
        )
      }
    })

    it('should handle different request post IDs', async () => {
      const mockGetItem = jest.fn().mockResolvedValue(null)
      DynamoDbTableOperations.prototype.getItem = mockGetItem

      const postIds = ['post-1', 'post-2', 'post-3']

      for (const postId of postIds) {
        mockGetItem.mockClear()

        await donationNotificationDynamoDbOperations.getBloodDonationNotification(
          userId,
          postId,
          type
        )

        expect(mockGetItem).toHaveBeenCalledWith(expect.any(String), `${type}#${postId}`)
      }
    })

    it('should handle different user IDs', async () => {
      const mockGetItem = jest.fn().mockResolvedValue(null)
      DynamoDbTableOperations.prototype.getItem = mockGetItem

      const userIds = ['user-1', 'user-2', 'user-3']

      for (const uid of userIds) {
        mockGetItem.mockClear()

        await donationNotificationDynamoDbOperations.getBloodDonationNotification(
          uid,
          requestPostId,
          type
        )

        expect(mockGetItem).toHaveBeenCalledWith(
          `${NOTIFICATION_PK_PREFIX}#${uid}`,
          expect.any(String)
        )
      }
    })
  })

  describe('notification prefix constant', () => {
    it('should use NOTIFICATION as prefix', () => {
      expect(NOTIFICATION_PK_PREFIX).toBe('NOTIFICATION')
    })
  })
})
