import type { SQSEvent } from 'aws-lambda'
import sendPushNotification from '../../notification/sendPushNotification'
import { NotificationService } from '../../../../application/notificationWorkflow/NotificationService'
import { UserService } from '../../../../application/userWorkflow/UserService'
import NotificationOperationError from '../../../../application/notificationWorkflow/NotificationOperationError'

jest.mock('../../../../application/notificationWorkflow/NotificationService')
jest.mock('../../../../application/userWorkflow/UserService')
jest.mock('../../commons/sns/SNSOperations')
jest.mock('../../commons/logger/ServiceLogger', () => ({
  createServiceLogger: jest.fn(() => ({
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }))
}))

const mockNotificationService = NotificationService as jest.MockedClass<typeof NotificationService>

describe('sendPushNotification', () => {
  const mockSQSEvent: SQSEvent = {
    Records: [
      {
        messageId: 'test-message-id',
        receiptHandle: 'test-receipt-handle',
        body: JSON.stringify({
          userId: 'test-user-id',
          title: 'Blood Donation Request',
          message: 'A donor is needed for blood type A+',
          data: {
            requestPostId: 'test-request-post-id',
            seekerId: 'test-seeker-id'
          }
        }),
        attributes: {
          ApproximateReceiveCount: '1',
          SentTimestamp: '1704067200000',
          SenderId: 'test-sender',
          ApproximateFirstReceiveTimestamp: '1704067200000'
        },
        messageAttributes: {},
        md5OfBody: 'test-md5',
        eventSource: 'aws:sqs',
        eventSourceARN: 'arn:aws:sqs:us-east-1:123456789012:test-queue',
        awsRegion: 'us-east-1'
      }
    ]
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should successfully send push notification', async () => {
    mockNotificationService.prototype.sendPushNotification.mockResolvedValue(undefined)

    await expect(sendPushNotification(mockSQSEvent)).resolves.not.toThrow()

    expect(mockNotificationService.prototype.sendPushNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'test-user-id',
        title: 'Blood Donation Request',
        message: 'A donor is needed for blood type A+',
        data: {
          requestPostId: 'test-request-post-id',
          seekerId: 'test-seeker-id'
        }
      }),
      'test-user-id',
      expect.any(Object),
      expect.any(Object),
      expect.any(Object)
    )
  })

  it('should process multiple records successfully', async () => {
    const multiRecordEvent: SQSEvent = {
      Records: [
        {
          ...mockSQSEvent.Records[0],
          body: JSON.stringify({
            userId: 'user-1',
            title: 'Notification 1',
            message: 'Message 1',
            data: {}
          })
        },
        {
          ...mockSQSEvent.Records[0],
          messageId: 'test-message-id-2',
          body: JSON.stringify({
            userId: 'user-2',
            title: 'Notification 2',
            message: 'Message 2',
            data: {}
          })
        }
      ]
    }

    mockNotificationService.prototype.sendPushNotification.mockResolvedValue(undefined)

    await sendPushNotification(multiRecordEvent)

    expect(mockNotificationService.prototype.sendPushNotification).toHaveBeenCalledTimes(2)
    expect(mockNotificationService.prototype.sendPushNotification).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        userId: 'user-1',
        title: 'Notification 1',
        message: 'Message 1'
      }),
      'user-1',
      expect.any(Object),
      expect.any(Object),
      expect.any(Object)
    )
    expect(mockNotificationService.prototype.sendPushNotification).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        userId: 'user-2',
        title: 'Notification 2',
        message: 'Message 2'
      }),
      'user-2',
      expect.any(Object),
      expect.any(Object),
      expect.any(Object)
    )
  })

  it('should handle NotificationOperationError and rethrow', async () => {
    const operationError = new NotificationOperationError('Notification operation failed')
    mockNotificationService.prototype.sendPushNotification.mockRejectedValue(operationError)

    await expect(sendPushNotification(mockSQSEvent)).rejects.toThrow(operationError)
  })

  it('should handle generic Error and rethrow', async () => {
    const genericError = new Error('Generic error occurred')
    mockNotificationService.prototype.sendPushNotification.mockRejectedValue(genericError)

    await expect(sendPushNotification(mockSQSEvent)).rejects.toThrow(genericError)
  })

  it('should parse SQS event body correctly with all notification attributes', async () => {
    const complexMockEvent: SQSEvent = {
      Records: [
        {
          ...mockSQSEvent.Records[0],
          body: JSON.stringify({
            userId: 'complex-user-id',
            title: 'Urgent: Blood Donation Needed',
            message: 'A patient needs blood type O- urgently',
            data: {
              requestPostId: 'complex-request-post-id',
              seekerId: 'complex-seeker-id',
              bloodType: 'O-',
              urgency: 'high',
              location: 'City Hospital'
            }
          })
        }
      ]
    }

    mockNotificationService.prototype.sendPushNotification.mockResolvedValue(undefined)

    await sendPushNotification(complexMockEvent)

    expect(mockNotificationService.prototype.sendPushNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'complex-user-id',
        title: 'Urgent: Blood Donation Needed',
        message: 'A patient needs blood type O- urgently',
        data: expect.objectContaining({
          requestPostId: 'complex-request-post-id',
          seekerId: 'complex-seeker-id',
          bloodType: 'O-',
          urgency: 'high',
          location: 'City Hospital'
        })
      }),
      'complex-user-id',
      expect.any(Object),
      expect.any(Object),
      expect.any(Object)
    )
  })

  it('should handle empty body as empty object', async () => {
    const eventWithEmptyBody: SQSEvent = {
      Records: [
        {
          ...mockSQSEvent.Records[0],
          body: ''
        }
      ]
    }

    mockNotificationService.prototype.sendPushNotification.mockResolvedValue(undefined)

    await sendPushNotification(eventWithEmptyBody)

    expect(mockNotificationService.prototype.sendPushNotification).toHaveBeenCalledWith(
      {},
      undefined,
      expect.any(Object),
      expect.any(Object),
      expect.any(Object)
    )
  })

  it('should handle whitespace-only body as empty object', async () => {
    const eventWithWhitespaceBody: SQSEvent = {
      Records: [
        {
          ...mockSQSEvent.Records[0],
          body: '   '
        }
      ]
    }

    mockNotificationService.prototype.sendPushNotification.mockResolvedValue(undefined)

    await sendPushNotification(eventWithWhitespaceBody)

    expect(mockNotificationService.prototype.sendPushNotification).toHaveBeenCalledWith(
      {},
      undefined,
      expect.any(Object),
      expect.any(Object),
      expect.any(Object)
    )
  })

  it('should create services with correct dependencies', async () => {
    mockNotificationService.prototype.sendPushNotification.mockResolvedValue(undefined)

    await sendPushNotification(mockSQSEvent)

    expect(NotificationService).toHaveBeenCalledWith(expect.any(Object), expect.any(Object))
    expect(UserService).toHaveBeenCalledWith(expect.any(Object), expect.any(Object))
  })

  it('should pass LocalCacheMapManager instance to sendPushNotification', async () => {
    mockNotificationService.prototype.sendPushNotification.mockResolvedValue(undefined)

    await sendPushNotification(mockSQSEvent)

    expect(mockNotificationService.prototype.sendPushNotification).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(String),
      expect.any(Object),
      expect.any(Object),
      expect.any(Object)
    )
  })

  it('should handle notification with minimal data', async () => {
    const minimalEvent: SQSEvent = {
      Records: [
        {
          ...mockSQSEvent.Records[0],
          body: JSON.stringify({
            userId: 'minimal-user-id',
            title: 'Test',
            message: 'Test message'
          })
        }
      ]
    }

    mockNotificationService.prototype.sendPushNotification.mockResolvedValue(undefined)

    await sendPushNotification(minimalEvent)

    expect(mockNotificationService.prototype.sendPushNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'minimal-user-id',
        title: 'Test',
        message: 'Test message'
      }),
      'minimal-user-id',
      expect.any(Object),
      expect.any(Object),
      expect.any(Object)
    )
  })

  it('should handle notification with additional custom fields', async () => {
    const customEvent: SQSEvent = {
      Records: [
        {
          ...mockSQSEvent.Records[0],
          body: JSON.stringify({
            userId: 'custom-user-id',
            title: 'Custom Notification',
            message: 'Custom message',
            data: {
              customField1: 'value1',
              customField2: 'value2',
              customField3: { nested: 'value' }
            }
          })
        }
      ]
    }

    mockNotificationService.prototype.sendPushNotification.mockResolvedValue(undefined)

    await sendPushNotification(customEvent)

    expect(mockNotificationService.prototype.sendPushNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'custom-user-id',
        title: 'Custom Notification',
        message: 'Custom message',
        data: expect.objectContaining({
          customField1: 'value1',
          customField2: 'value2',
          customField3: { nested: 'value' }
        })
      }),
      'custom-user-id',
      expect.any(Object),
      expect.any(Object),
      expect.any(Object)
    )
  })

  it('should propagate NotificationOperationError with specific error message', async () => {
    const specificError = new NotificationOperationError('User device not registered')
    mockNotificationService.prototype.sendPushNotification.mockRejectedValue(specificError)

    await expect(sendPushNotification(mockSQSEvent)).rejects.toThrow('User device not registered')
  })
})
