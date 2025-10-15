import DonationNotificationModel from '../../commons/ddbModels/DonationNotificationModel'
import { NOTIFICATION_PK_PREFIX } from '../../commons/ddbModels/NotificationModel'
import type { DonationNotificationDTO } from '../../../../../commons/dto/NotificationDTO'
import { NotificationType } from '../../../../../commons/dto/NotificationDTO'
import { AcceptDonationStatus } from '../../../../../commons/dto/DonationDTO'

describe('DonationNotificationModel', () => {
  let model: DonationNotificationModel

  beforeEach(() => {
    model = new DonationNotificationModel()
  })

  describe('getPrimaryIndex', () => {
    it('should return correct primary index definition', () => {
      const primaryIndex = model.getPrimaryIndex()

      expect(primaryIndex).toEqual({
        partitionKey: 'PK',
        sortKey: 'SK'
      })
    })
  })

  describe('getIndexDefinitions', () => {
    it('should return GSI1 index definition', () => {
      const indexDefinitions = model.getIndexDefinitions()

      expect(indexDefinitions).toEqual({
        GSI: {
          GSI1: {
            partitionKey: 'GSI1PK',
            sortKey: 'GSI1SK'
          }
        }
      })
    })
  })

  describe('getIndex', () => {
    it('should return GSI1 index when requested', () => {
      const gsiIndex = model.getIndex('GSI', 'GSI1')

      expect(gsiIndex).toEqual({
        partitionKey: 'GSI1PK',
        sortKey: 'GSI1SK'
      })
    })

    it('should return undefined for non-existent GSI index', () => {
      const gsiIndex = model.getIndex('GSI', 'GSI2')

      expect(gsiIndex).toBeUndefined()
    })

    it('should return undefined for LSI index', () => {
      const lsiIndex = model.getIndex('LSI', 'LSI1')

      expect(lsiIndex).toBeUndefined()
    })
  })

  describe('fromDto', () => {
    it('should convert DonationNotificationDTO to DonationNotificationFields correctly', () => {
      const dto: DonationNotificationDTO = {
        id: 'notification-123',
        userId: 'test-user-id',
        type: NotificationType.BLOOD_REQ_POST,
        title: 'Blood Donation Request',
        body: 'A patient needs blood type A+',
        status: AcceptDonationStatus.PENDING,
        payload: {
          seekerId: 'seeker-123',
          requestPostId: 'request-456',
          createdAt: '2024-01-01T00:00:00.000Z',
          bloodQuantity: 2,
          requestedBloodGroup: 'A+',
          urgencyLevel: 'urgent',
          contactNumber: '+8801234567890',
          donationDateTime: '2024-01-05T10:00:00.000Z'
        },
        createdAt: '2024-01-01T00:00:00.000Z'
      }

      const fields = model.fromDto(dto)

      expect(fields.PK).toBe(`${NOTIFICATION_PK_PREFIX}#test-user-id`)
      expect(fields.SK).toBe(`${NotificationType.BLOOD_REQ_POST}#notification-123`)
      expect(fields.title).toBe('Blood Donation Request')
      expect(fields.body).toBe('A patient needs blood type A+')
      expect(fields.status).toBe(AcceptDonationStatus.PENDING)
      expect(fields.payload).toEqual(dto.payload)
      expect(fields.createdAt).toBe('2024-01-01T00:00:00.000Z')
      expect(fields).not.toHaveProperty('id')
      expect(fields).not.toHaveProperty('userId')
      expect(fields).not.toHaveProperty('type')
    })

    it('should set GSI1PK and GSI1SK for BLOOD_REQ_POST notification type', () => {
      const dto: DonationNotificationDTO = {
        id: 'notification-123',
        userId: 'user-456',
        type: NotificationType.BLOOD_REQ_POST,
        title: 'Blood Request',
        body: 'Need blood',
        status: AcceptDonationStatus.PENDING,
        payload: {
          seekerId: 'seeker-123',
          requestPostId: 'request-456',
          createdAt: '2024-01-01T00:00:00.000Z',
          bloodQuantity: 2,
          requestedBloodGroup: 'A+',
          urgencyLevel: 'urgent',
          contactNumber: '+8801234567890',
          donationDateTime: '2024-01-05T10:00:00.000Z'
        },
        createdAt: '2024-01-01T00:00:00.000Z'
      }

      const fields = model.fromDto(dto)

      expect(fields.GSI1PK).toBe('notification-123')
      expect(fields.GSI1SK).toBe(`${NOTIFICATION_PK_PREFIX}#${AcceptDonationStatus.PENDING}#user-456`)
    })

    it('should set GSI1PK and GSI1SK for REQ_ACCEPTED notification type', () => {
      const dto: DonationNotificationDTO = {
        id: 'notification-789',
        userId: 'user-123',
        type: NotificationType.REQ_ACCEPTED,
        title: 'Request Accepted',
        body: 'Your request was accepted',
        status: AcceptDonationStatus.ACCEPTED,
        payload: {
          seekerId: 'seeker-123',
          requestPostId: 'request-456',
          donorId: 'donor-789',
          createdAt: '2024-01-01T00:00:00.000Z',
          donorName: 'John Doe',
          phoneNumbers: ['+8801234567890'],
          requestedBloodGroup: 'A+',
          urgencyLevel: 'urgent',
          location: 'Dhaka Medical',
          donationDateTime: '2024-01-05T10:00:00.000Z'
        },
        createdAt: '2024-01-01T00:00:00.000Z'
      }

      const fields = model.fromDto(dto)

      expect(fields.GSI1PK).toBe('notification-789')
      expect(fields.GSI1SK).toBe(`${NOTIFICATION_PK_PREFIX}#${AcceptDonationStatus.ACCEPTED}#user-123`)
    })

    it('should set GSI1PK and GSI1SK for REQ_IGNORED notification type', () => {
      const dto: DonationNotificationDTO = {
        id: 'notification-999',
        userId: 'user-888',
        type: NotificationType.REQ_IGNORED,
        title: 'Request Ignored',
        body: 'Your request was ignored',
        status: AcceptDonationStatus.IGNORED,
        payload: {
          seekerId: 'seeker-123',
          requestPostId: 'request-456',
          donorId: 'donor-789',
          createdAt: '2024-01-01T00:00:00.000Z',
          donorName: 'Jane Smith',
          phoneNumbers: ['+8801234567891'],
          requestedBloodGroup: 'B+',
          urgencyLevel: 'regular',
          location: 'City Hospital',
          donationDateTime: '2024-01-05T10:00:00.000Z'
        },
        createdAt: '2024-01-01T00:00:00.000Z'
      }

      const fields = model.fromDto(dto)

      expect(fields.GSI1PK).toBe('notification-999')
      expect(fields.GSI1SK).toBe(`${NOTIFICATION_PK_PREFIX}#${AcceptDonationStatus.IGNORED}#user-888`)
    })

    it('should not set GSI1PK and GSI1SK for COMMON notification type', () => {
      const dto: DonationNotificationDTO = {
        id: 'notification-111',
        userId: 'user-222',
        type: NotificationType.COMMON,
        title: 'Common Notification',
        body: 'This is a common notification',
        status: AcceptDonationStatus.PENDING,
        payload: {
          seekerId: 'seeker-123',
          requestPostId: 'request-456',
          createdAt: '2024-01-01T00:00:00.000Z',
          bloodQuantity: 2,
          requestedBloodGroup: 'A+',
          urgencyLevel: 'urgent',
          contactNumber: '+8801234567890',
          donationDateTime: '2024-01-05T10:00:00.000Z'
        },
        createdAt: '2024-01-01T00:00:00.000Z'
      }

      const fields = model.fromDto(dto)

      expect(fields.GSI1PK).toBeUndefined()
      expect(fields.GSI1SK).toBeUndefined()
    })

    it('should set LSI1SK when status is defined', () => {
      const dto: DonationNotificationDTO = {
        id: 'notification-123',
        userId: 'user-456',
        type: NotificationType.BLOOD_REQ_POST,
        title: 'Blood Request',
        body: 'Need blood',
        status: AcceptDonationStatus.PENDING,
        payload: {
          seekerId: 'seeker-123',
          requestPostId: 'request-456',
          createdAt: '2024-01-01T00:00:00.000Z',
          bloodQuantity: 2,
          requestedBloodGroup: 'A+',
          urgencyLevel: 'urgent',
          contactNumber: '+8801234567890',
          donationDateTime: '2024-01-05T10:00:00.000Z'
        },
        createdAt: '2024-01-01T00:00:00.000Z'
      }

      const fields = model.fromDto(dto)

      expect(fields.LSI1SK).toBe(`STATUS#${AcceptDonationStatus.PENDING}#notification-123`)
    })

    it('should handle different donation statuses', () => {
      const statuses = [
        AcceptDonationStatus.PENDING,
        AcceptDonationStatus.ACCEPTED,
        AcceptDonationStatus.COMPLETED,
        AcceptDonationStatus.IGNORED
      ]

      statuses.forEach((status) => {
        const dto: DonationNotificationDTO = {
          id: 'notif-123',
          userId: 'user-id',
          type: NotificationType.BLOOD_REQ_POST,
          title: 'Test',
          body: 'Test message',
          status,
          payload: {
            seekerId: 'seeker-123',
            requestPostId: 'request-456',
            createdAt: '2024-01-01T00:00:00.000Z',
            bloodQuantity: 2,
            requestedBloodGroup: 'A+',
            urgencyLevel: 'urgent',
            contactNumber: '+8801234567890',
            donationDateTime: '2024-01-05T10:00:00.000Z'
          },
          createdAt: '2024-01-01T00:00:00.000Z'
        }

        const fields = model.fromDto(dto)

        expect(fields.LSI1SK).toBe(`STATUS#${status}#notif-123`)
        expect(fields.GSI1SK).toBe(`${NOTIFICATION_PK_PREFIX}#${status}#user-id`)
      })
    })
  })

  describe('toDto', () => {
    it('should convert DonationNotificationFields to DonationNotificationDTO correctly', () => {
      const fields = {
        PK: `${NOTIFICATION_PK_PREFIX}#test-user-id` as const,
        SK: `${NotificationType.BLOOD_REQ_POST}#notification-123`,
        title: 'Blood Donation Request',
        body: 'A patient needs blood type A+',
        status: AcceptDonationStatus.PENDING,
        payload: {
          seekerId: 'seeker-123',
          requestPostId: 'request-456',
          createdAt: '2024-01-01T00:00:00.000Z',
          bloodQuantity: 2,
          requestedBloodGroup: 'A+',
          urgencyLevel: 'urgent',
          contactNumber: '+8801234567890',
          donationDateTime: '2024-01-05T10:00:00.000Z'
        },
        createdAt: '2024-01-01T00:00:00.000Z'
      }

      const dto = model.toDto(fields)

      expect(dto.userId).toBe('test-user-id')
      expect(dto.type).toBe(NotificationType.BLOOD_REQ_POST)
      expect(dto.id).toBe('notification-123')
      expect(dto.title).toBe('Blood Donation Request')
      expect(dto.body).toBe('A patient needs blood type A+')
      expect(dto.status).toBe(AcceptDonationStatus.PENDING)
      expect(dto.payload).toEqual(fields.payload)
      expect(dto.createdAt).toBe('2024-01-01T00:00:00.000Z')
      expect(dto).not.toHaveProperty('PK')
      expect(dto).not.toHaveProperty('SK')
      expect(dto).not.toHaveProperty('GSI1PK')
      expect(dto).not.toHaveProperty('GSI1SK')
      expect(dto).not.toHaveProperty('LSI1SK')
    })

    it('should extract userId from PK correctly', () => {
      const fields = {
        PK: `${NOTIFICATION_PK_PREFIX}#complex-user-id-123` as const,
        SK: `${NotificationType.REQ_ACCEPTED}#notif-123`,
        title: 'Test',
        body: 'Test message',
        status: AcceptDonationStatus.ACCEPTED,
        payload: {
          seekerId: 'seeker-123',
          requestPostId: 'request-456',
          donorId: 'donor-789',
          createdAt: '2024-01-01T00:00:00.000Z',
          donorName: 'John Doe',
          phoneNumbers: ['+8801234567890'],
          requestedBloodGroup: 'A+',
          urgencyLevel: 'urgent',
          location: 'Dhaka Medical',
          donationDateTime: '2024-01-05T10:00:00.000Z'
        },
        createdAt: '2024-01-01T00:00:00.000Z'
      }

      const dto = model.toDto(fields)

      expect(dto.userId).toBe('complex-user-id-123')
    })

    it('should extract type from SK correctly', () => {
      const types = [
        NotificationType.BLOOD_REQ_POST,
        NotificationType.REQ_ACCEPTED,
        NotificationType.REQ_IGNORED,
        NotificationType.COMMON
      ]

      types.forEach((type) => {
        const fields = {
          PK: `${NOTIFICATION_PK_PREFIX}#user-id` as const,
          SK: `${type}#notif-123`,
          title: 'Test',
          body: 'Test message',
          status: AcceptDonationStatus.PENDING,
          payload: {
            seekerId: 'seeker-123',
            requestPostId: 'request-456',
            createdAt: '2024-01-01T00:00:00.000Z',
            bloodQuantity: 2,
            requestedBloodGroup: 'A+',
            urgencyLevel: 'urgent',
            contactNumber: '+8801234567890',
            donationDateTime: '2024-01-05T10:00:00.000Z'
          },
          createdAt: '2024-01-01T00:00:00.000Z'
        }

        const dto = model.toDto(fields)

        expect(dto.type).toBe(type)
      })
    })

    it('should extract id from SK correctly', () => {
      const fields = {
        PK: `${NOTIFICATION_PK_PREFIX}#user-id` as const,
        SK: `${NotificationType.BLOOD_REQ_POST}#complex-notification-id-789`,
        title: 'Test',
        body: 'Test message',
        status: AcceptDonationStatus.PENDING,
        payload: {
          seekerId: 'seeker-123',
          requestPostId: 'request-456',
          createdAt: '2024-01-01T00:00:00.000Z',
          bloodQuantity: 2,
          requestedBloodGroup: 'A+',
          urgencyLevel: 'urgent',
          contactNumber: '+8801234567890',
          donationDateTime: '2024-01-05T10:00:00.000Z'
        },
        createdAt: '2024-01-01T00:00:00.000Z'
      }

      const dto = model.toDto(fields)

      expect(dto.id).toBe('complex-notification-id-789')
    })

    it('should preserve payload with all fields', () => {
      const payload = {
        seekerId: 'seeker-123',
        requestPostId: 'request-456',
        createdAt: '2024-01-01T00:00:00.000Z',
        bloodQuantity: 3,
        requestedBloodGroup: 'O-',
        urgencyLevel: 'urgent',
        contactNumber: '+8801234567890',
        donationDateTime: '2024-01-05T10:00:00.000Z',
        seekerName: 'Jane Doe',
        patientName: 'John Patient',
        location: 'Emergency Ward',
        locationId: 'loc-123',
        shortDescription: 'Urgent surgery',
        transportationInfo: 'Ambulance available',
        distance: 5.5
      }

      const fields = {
        PK: `${NOTIFICATION_PK_PREFIX}#user-id` as const,
        SK: `${NotificationType.BLOOD_REQ_POST}#notif-123`,
        title: 'Blood Donation Request',
        body: 'Urgent request',
        status: AcceptDonationStatus.PENDING,
        payload,
        createdAt: '2024-01-01T00:00:00.000Z'
      }

      const dto = model.toDto(fields)

      expect(dto.payload).toEqual(payload)
    })

    it('should handle GSI1PK and GSI1SK fields without including them in DTO', () => {
      const fields = {
        PK: `${NOTIFICATION_PK_PREFIX}#user-id` as const,
        SK: `${NotificationType.BLOOD_REQ_POST}#notif-123`,
        GSI1PK: 'notif-123',
        GSI1SK: `${NOTIFICATION_PK_PREFIX}#${AcceptDonationStatus.PENDING}#user-id`,
        LSI1SK: `STATUS#${AcceptDonationStatus.PENDING}#notif-123`,
        title: 'Test',
        body: 'Test message',
        status: AcceptDonationStatus.PENDING,
        payload: {
          seekerId: 'seeker-123',
          requestPostId: 'request-456',
          createdAt: '2024-01-01T00:00:00.000Z',
          bloodQuantity: 2,
          requestedBloodGroup: 'A+',
          urgencyLevel: 'urgent',
          contactNumber: '+8801234567890',
          donationDateTime: '2024-01-05T10:00:00.000Z'
        },
        createdAt: '2024-01-01T00:00:00.000Z'
      }

      const dto = model.toDto(fields)

      expect(dto).not.toHaveProperty('GSI1PK')
      expect(dto).not.toHaveProperty('GSI1SK')
      expect(dto).not.toHaveProperty('LSI1SK')
    })
  })

  describe('roundtrip conversion', () => {
    it('should maintain data integrity through fromDto and toDto for BLOOD_REQ_POST', () => {
      const originalDto: DonationNotificationDTO = {
        id: 'notification-123',
        userId: 'test-user-id',
        type: NotificationType.BLOOD_REQ_POST,
        title: 'Blood Donation Request',
        body: 'A patient needs blood type A+',
        status: AcceptDonationStatus.PENDING,
        payload: {
          seekerId: 'seeker-123',
          requestPostId: 'request-456',
          createdAt: '2024-01-01T00:00:00.000Z',
          bloodQuantity: 2,
          requestedBloodGroup: 'A+',
          urgencyLevel: 'urgent',
          contactNumber: '+8801234567890',
          donationDateTime: '2024-01-05T10:00:00.000Z'
        },
        createdAt: '2024-01-01T00:00:00.000Z'
      }

      const fields = model.fromDto(originalDto)
      const convertedDto = model.toDto(fields)

      expect(convertedDto).toEqual(originalDto)
    })

    it('should maintain data integrity through fromDto and toDto for REQ_ACCEPTED', () => {
      const originalDto: DonationNotificationDTO = {
        id: 'notification-789',
        userId: 'user-123',
        type: NotificationType.REQ_ACCEPTED,
        title: 'Request Accepted',
        body: 'Your request was accepted',
        status: AcceptDonationStatus.ACCEPTED,
        payload: {
          seekerId: 'seeker-123',
          requestPostId: 'request-456',
          donorId: 'donor-789',
          createdAt: '2024-01-01T00:00:00.000Z',
          donorName: 'John Doe',
          phoneNumbers: ['+8801234567890'],
          requestedBloodGroup: 'A+',
          urgencyLevel: 'urgent',
          location: 'Dhaka Medical',
          donationDateTime: '2024-01-05T10:00:00.000Z'
        },
        createdAt: '2024-01-01T00:00:00.000Z'
      }

      const fields = model.fromDto(originalDto)
      const convertedDto = model.toDto(fields)

      expect(convertedDto).toEqual(originalDto)
    })

    it('should handle multiple roundtrip conversions', () => {
      const originalDto: DonationNotificationDTO = {
        id: 'notif-456',
        userId: 'user-789',
        type: NotificationType.REQ_IGNORED,
        title: 'Request Ignored',
        body: 'Request was ignored',
        status: AcceptDonationStatus.IGNORED,
        payload: {
          seekerId: 'seeker-123',
          requestPostId: 'request-456',
          donorId: 'donor-789',
          createdAt: '2024-01-01T00:00:00.000Z',
          donorName: 'Jane Smith',
          phoneNumbers: ['+8801234567891'],
          requestedBloodGroup: 'B+',
          urgencyLevel: 'regular',
          location: 'City Hospital',
          donationDateTime: '2024-01-05T10:00:00.000Z'
        },
        createdAt: '2024-12-31T23:59:59.999Z'
      }

      // First roundtrip
      const fields1 = model.fromDto(originalDto)
      const dto1 = model.toDto(fields1)

      // Second roundtrip
      const fields2 = model.fromDto(dto1)
      const dto2 = model.toDto(fields2)

      expect(dto2).toEqual(originalDto)
      expect(dto1).toEqual(dto2)
    })
  })
})
