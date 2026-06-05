import NotificationModel, {
  NOTIFICATION_PK_PREFIX
} from '../../commons/ddbModels/NotificationModel'
import type { NotificationDTO } from '../../../../../commons/dto/NotificationDTO'

describe('NotificationModel', () => {
  let model: NotificationModel

  beforeEach(() => {
    model = new NotificationModel()
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
    it('should return empty object for index definitions', () => {
      const indexDefinitions = model.getIndexDefinitions()

      expect(indexDefinitions).toEqual({})
    })
  })

  describe('getIndex', () => {
    it('should return undefined for any index type and name', () => {
      const gsiIndex = model.getIndex('GSI', 'GSI1')
      const lsiIndex = model.getIndex('LSI', 'LSI1')

      expect(gsiIndex).toBeUndefined()
      expect(lsiIndex).toBeUndefined()
    })
  })

  describe('fromDto', () => {
    it('should convert NotificationDTO to NotificationFields correctly', () => {
      const dto: NotificationDTO = {
        id: 'notification-123',
        userId: 'test-user-id',
        type: 'DONATION_REQUEST',
        title: 'Blood Donation Request',
        message: 'A patient needs blood type A+',
        read: false,
        createdAt: '2024-01-01T00:00:00.000Z'
      }

      const fields = model.fromDto(dto)

      expect(fields.PK).toBe(`${NOTIFICATION_PK_PREFIX}#test-user-id`)
      expect(fields.SK).toBe('DONATION_REQUEST#notification-123')
      expect(fields.title).toBe('Blood Donation Request')
      expect(fields.message).toBe('A patient needs blood type A+')
      expect(fields.read).toBe(false)
      expect(fields.createdAt).toBe('2024-01-01T00:00:00.000Z')
      expect(fields).not.toHaveProperty('id')
      expect(fields).not.toHaveProperty('userId')
      expect(fields).not.toHaveProperty('type')
    })

    it('should handle different notification types', () => {
      const types = ['DONATION_REQUEST', 'DONATION_ACCEPTED', 'DONATION_COMPLETED', 'SYSTEM_ALERT']

      types.forEach((type) => {
        const dto: NotificationDTO = {
          id: 'notif-123',
          userId: 'user-id',
          type: type as NotificationDTO['type'],
          title: 'Test',
          message: 'Test message',
          read: false,
          createdAt: '2024-01-01T00:00:00.000Z'
        }

        const fields = model.fromDto(dto)

        expect(fields.SK).toBe(`${type}#notif-123`)
      })
    })

    it('should handle read and unread notifications', () => {
      const readDto: NotificationDTO = {
        id: 'notif-1',
        userId: 'user-id',
        type: 'DONATION_REQUEST',
        title: 'Test',
        message: 'Test',
        read: true,
        createdAt: '2024-01-01T00:00:00.000Z'
      }

      const unreadDto: NotificationDTO = {
        id: 'notif-2',
        userId: 'user-id',
        type: 'DONATION_REQUEST',
        title: 'Test',
        message: 'Test',
        read: false,
        createdAt: '2024-01-01T00:00:00.000Z'
      }

      const readFields = model.fromDto(readDto)
      const unreadFields = model.fromDto(unreadDto)

      expect(readFields.read).toBe(true)
      expect(unreadFields.read).toBe(false)
    })

    it('should preserve additional DTO fields', () => {
      const dto: NotificationDTO = {
        id: 'notif-123',
        userId: 'user-id',
        type: 'DONATION_REQUEST',
        title: 'Blood Donation Request',
        message: 'Urgent request',
        read: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        data: {
          requestPostId: 'request-123',
          seekerId: 'seeker-456',
          bloodType: 'A+'
        },
        actionUrl: '/donation/request-123',
        expiresAt: '2024-01-02T00:00:00.000Z'
      }

      const fields = model.fromDto(dto)

      expect(fields.data).toEqual({
        requestPostId: 'request-123',
        seekerId: 'seeker-456',
        bloodType: 'A+'
      })
      expect(fields.actionUrl).toBe('/donation/request-123')
      expect(fields.expiresAt).toBe('2024-01-02T00:00:00.000Z')
    })

    it('should handle complex IDs with special characters', () => {
      const dto: NotificationDTO = {
        id: 'notification-id-with-dashes-123',
        userId: 'user-id-with-underscores_456',
        type: 'DONATION_REQUEST',
        title: 'Test',
        message: 'Test',
        read: false,
        createdAt: '2024-01-01T00:00:00.000Z'
      }

      const fields = model.fromDto(dto)

      expect(fields.PK).toContain('user-id-with-underscores_456')
      expect(fields.SK).toContain('notification-id-with-dashes-123')
    })
  })

  describe('toDto', () => {
    it('should convert NotificationFields to NotificationDTO correctly', () => {
      const fields = {
        PK: `${NOTIFICATION_PK_PREFIX}#test-user-id` as const,
        SK: 'DONATION_REQUEST#notification-123',
        title: 'Blood Donation Request',
        message: 'A patient needs blood type A+',
        read: false,
        createdAt: '2024-01-01T00:00:00.000Z'
      }

      const dto = model.toDto(fields)

      expect(dto.userId).toBe('test-user-id')
      expect(dto.type).toBe('DONATION_REQUEST')
      expect(dto.id).toBe('notification-123')
      expect(dto.title).toBe('Blood Donation Request')
      expect(dto.message).toBe('A patient needs blood type A+')
      expect(dto.read).toBe(false)
      expect(dto.createdAt).toBe('2024-01-01T00:00:00.000Z')
      expect(dto).not.toHaveProperty('PK')
      expect(dto).not.toHaveProperty('SK')
    })

    it('should extract userId from PK correctly', () => {
      const fields = {
        PK: `${NOTIFICATION_PK_PREFIX}#complex-user-id-123` as const,
        SK: 'DONATION_REQUEST#notif-123',
        title: 'Test',
        message: 'Test',
        read: false,
        createdAt: '2024-01-01T00:00:00.000Z'
      }

      const dto = model.toDto(fields)

      expect(dto.userId).toBe('complex-user-id-123')
    })

    it('should extract type from SK correctly', () => {
      const types = ['DONATION_REQUEST', 'DONATION_ACCEPTED', 'DONATION_COMPLETED', 'SYSTEM_ALERT']

      types.forEach((type) => {
        const fields = {
          PK: `${NOTIFICATION_PK_PREFIX}#user-id` as const,
          SK: `${type}#notif-123`,
          title: 'Test',
          message: 'Test',
          read: false,
          createdAt: '2024-01-01T00:00:00.000Z'
        }

        const dto = model.toDto(fields)

        expect(dto.type).toBe(type)
      })
    })

    it('should extract id from SK correctly', () => {
      const fields = {
        PK: `${NOTIFICATION_PK_PREFIX}#user-id` as const,
        SK: 'DONATION_REQUEST#complex-notification-id-789',
        title: 'Test',
        message: 'Test',
        read: false,
        createdAt: '2024-01-01T00:00:00.000Z'
      }

      const dto = model.toDto(fields)

      expect(dto.id).toBe('complex-notification-id-789')
    })

    it('should preserve additional fields', () => {
      const fields = {
        PK: `${NOTIFICATION_PK_PREFIX}#user-id` as const,
        SK: 'DONATION_REQUEST#notif-123',
        title: 'Blood Donation Request',
        message: 'Urgent request',
        read: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        data: {
          requestPostId: 'request-123',
          seekerId: 'seeker-456'
        },
        actionUrl: '/donation/request-123',
        expiresAt: '2024-01-02T00:00:00.000Z'
      }

      const dto = model.toDto(fields)

      expect(dto.data).toEqual({
        requestPostId: 'request-123',
        seekerId: 'seeker-456'
      })
      expect(dto.actionUrl).toBe('/donation/request-123')
      expect(dto.expiresAt).toBe('2024-01-02T00:00:00.000Z')
    })

    it('should handle notification ID with hash symbols', () => {
      const fields = {
        PK: `${NOTIFICATION_PK_PREFIX}#user-id` as const,
        SK: 'DONATION_REQUEST#notif-with#hash#symbols',
        title: 'Test',
        message: 'Test',
        read: false,
        createdAt: '2024-01-01T00:00:00.000Z'
      }

      const dto = model.toDto(fields)

      // Note: Current implementation splits on all # symbols
      // So IDs containing # will be truncated at the first # within the ID
      expect(dto.id).toBe('notif-with')
    })

    it('should handle notification with nested data objects', () => {
      const fields = {
        PK: `${NOTIFICATION_PK_PREFIX}#user-id` as const,
        SK: 'DONATION_REQUEST#notif-123',
        title: 'Test',
        message: 'Test',
        read: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        data: {
          request: {
            id: 'req-123',
            bloodType: 'A+',
            location: {
              lat: 23.8103,
              lng: 90.4125,
              address: 'Dhaka'
            }
          }
        }
      }

      const dto = model.toDto(fields)

      expect(dto.data).toEqual({
        request: {
          id: 'req-123',
          bloodType: 'A+',
          location: {
            lat: 23.8103,
            lng: 90.4125,
            address: 'Dhaka'
          }
        }
      })
    })
  })

  describe('roundtrip conversion', () => {
    it('should maintain data integrity through fromDto and toDto', () => {
      const originalDto: NotificationDTO = {
        id: 'notification-123',
        userId: 'test-user-id',
        type: 'DONATION_REQUEST',
        title: 'Blood Donation Request',
        message: 'A patient needs blood type A+',
        read: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        data: {
          requestPostId: 'request-123'
        }
      }

      const fields = model.fromDto(originalDto)
      const convertedDto = model.toDto(fields)

      expect(convertedDto).toEqual(originalDto)
    })

    it('should handle multiple roundtrip conversions', () => {
      const originalDto: NotificationDTO = {
        id: 'notif-456',
        userId: 'user-789',
        type: 'DONATION_COMPLETED',
        title: 'Donation Completed',
        message: 'Thank you for your donation',
        read: true,
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

    it('should handle complex notification with all fields in roundtrip', () => {
      const originalDto: NotificationDTO = {
        id: 'complex-notif-123',
        userId: 'complex-user-456',
        type: 'DONATION_REQUEST',
        title: 'Urgent Blood Request',
        message: 'Patient needs O- blood urgently',
        read: false,
        createdAt: '2024-06-15T14:30:00.000Z',
        data: {
          requestPostId: 'req-789',
          bloodType: 'O-',
          urgency: 'HIGH',
          location: 'Emergency Room'
        },
        actionUrl: '/donation/req-789',
        expiresAt: '2024-06-16T14:30:00.000Z'
      }

      const fields = model.fromDto(originalDto)
      const convertedDto = model.toDto(fields)

      expect(convertedDto).toEqual(originalDto)
    })
  })
})
