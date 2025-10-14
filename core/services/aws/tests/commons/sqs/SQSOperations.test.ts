import { SQS, ChangeMessageVisibilityCommand } from '@aws-sdk/client-sqs'
import SQSOperations from '../../../commons/sqs/SQSOperations'
import type { DTO } from '../../../../../../commons/dto/DTOCommon'

jest.mock('@aws-sdk/client-sqs')

const mockSQS = SQS as jest.MockedClass<typeof SQS>
const mockChangeMessageVisibilityCommand = ChangeMessageVisibilityCommand as jest.MockedClass<
  typeof ChangeMessageVisibilityCommand
>

describe('SQSOperations', () => {
  let sqsOperations: SQSOperations
  const mockRegion = 'us-east-1'
  const mockQueueUrl = 'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue'
  let mockSendMessage: jest.Mock
  let mockSend: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    mockSendMessage = jest.fn()
    mockSend = jest.fn()
    mockSQS.mockImplementation(() => ({
      sendMessage: mockSendMessage,
      send: mockSend
    }) as unknown as SQS)
    sqsOperations = new SQSOperations(mockRegion)
  })

  describe('queue', () => {
    it('should successfully queue a message without delay', async () => {
      const mockMessageBody: DTO = {
        userId: 'test-user-id',
        requestPostId: 'test-request-id',
        type: 'DONATION_REQUEST'
      }

      mockSendMessage.mockResolvedValue({
        MessageId: 'test-message-id',
        MD5OfMessageBody: 'test-md5'
      })

      await sqsOperations.queue(mockMessageBody, mockQueueUrl)

      expect(mockSendMessage).toHaveBeenCalledWith({
        QueueUrl: mockQueueUrl,
        MessageBody: JSON.stringify(mockMessageBody)
      })
    })

    it('should successfully queue a message with delay', async () => {
      const mockMessageBody: DTO = {
        userId: 'test-user-id',
        requestPostId: 'test-request-id',
        type: 'DONATION_REQUEST'
      }
      const delaySeconds = 30

      mockSendMessage.mockResolvedValue({
        MessageId: 'test-message-id',
        MD5OfMessageBody: 'test-md5'
      })

      await sqsOperations.queue(mockMessageBody, mockQueueUrl, delaySeconds)

      expect(mockSendMessage).toHaveBeenCalledWith({
        QueueUrl: mockQueueUrl,
        MessageBody: JSON.stringify(mockMessageBody),
        DelaySeconds: delaySeconds
      })
    })

    it('should handle delay of 0 seconds', async () => {
      const mockMessageBody: DTO = {
        userId: 'test-user-id',
        type: 'TEST'
      }

      mockSendMessage.mockResolvedValue({})

      await sqsOperations.queue(mockMessageBody, mockQueueUrl, 0)

      expect(mockSendMessage).toHaveBeenCalledWith({
        QueueUrl: mockQueueUrl,
        MessageBody: JSON.stringify(mockMessageBody),
        DelaySeconds: 0
      })
    })

    it('should serialize complex message body correctly', async () => {
      const complexMessageBody: DTO = {
        userId: 'test-user-id',
        requestPostId: 'test-request-id',
        type: 'DONATION_REQUEST',
        metadata: {
          bloodType: 'A+',
          location: {
            lat: 23.8103,
            lng: 90.4125,
            address: 'Dhaka, Bangladesh'
          },
          urgency: 'high',
          donorsNeeded: 3
        },
        timestamps: {
          createdAt: '2024-01-01T00:00:00.000Z',
          expiresAt: '2024-01-02T00:00:00.000Z'
        }
      }

      mockSendMessage.mockResolvedValue({})

      await sqsOperations.queue(complexMessageBody, mockQueueUrl)

      expect(mockSendMessage).toHaveBeenCalledWith({
        QueueUrl: mockQueueUrl,
        MessageBody: JSON.stringify(complexMessageBody)
      })
    })

    it('should throw error when message sending fails', async () => {
      const mockMessageBody: DTO = {
        userId: 'test-user-id',
        type: 'TEST'
      }

      mockSendMessage.mockRejectedValue(new Error('SQS send failed'))

      await expect(sqsOperations.queue(mockMessageBody, mockQueueUrl)).rejects.toThrow(
        'SQS send failed'
      )
    })

    it('should handle empty message body object', async () => {
      const emptyMessageBody: DTO = {}

      mockSendMessage.mockResolvedValue({})

      await sqsOperations.queue(emptyMessageBody, mockQueueUrl)

      expect(mockSendMessage).toHaveBeenCalledWith({
        QueueUrl: mockQueueUrl,
        MessageBody: JSON.stringify(emptyMessageBody)
      })
    })

    it('should handle message with array values', async () => {
      const messageWithArrays: DTO = {
        userId: 'test-user-id',
        donorIds: ['donor-1', 'donor-2', 'donor-3'],
        locations: ['Location A', 'Location B']
      }

      mockSendMessage.mockResolvedValue({})

      await sqsOperations.queue(messageWithArrays, mockQueueUrl)

      expect(mockSendMessage).toHaveBeenCalledWith({
        QueueUrl: mockQueueUrl,
        MessageBody: JSON.stringify(messageWithArrays)
      })
    })

    it('should handle large delay seconds', async () => {
      const mockMessageBody: DTO = {
        userId: 'test-user-id',
        type: 'SCHEDULED'
      }
      const largeDelay = 900 // 15 minutes (maximum for SQS)

      mockSendMessage.mockResolvedValue({})

      await sqsOperations.queue(mockMessageBody, mockQueueUrl, largeDelay)

      expect(mockSendMessage).toHaveBeenCalledWith({
        QueueUrl: mockQueueUrl,
        MessageBody: JSON.stringify(mockMessageBody),
        DelaySeconds: largeDelay
      })
    })
  })

  describe('updateVisibilityTimeout', () => {
    it('should successfully update visibility timeout', async () => {
      const mockReceiptHandle = 'test-receipt-handle-12345'
      const visibilityTimeout = 300

      mockSend.mockResolvedValue({})

      await sqsOperations.updateVisibilityTimeout(
        mockReceiptHandle,
        mockQueueUrl,
        visibilityTimeout
      )

      expect(mockSend).toHaveBeenCalledTimes(1)
      expect(mockChangeMessageVisibilityCommand).toHaveBeenCalledWith({
        QueueUrl: mockQueueUrl,
        ReceiptHandle: mockReceiptHandle,
        VisibilityTimeout: visibilityTimeout
      })
    })

    it('should convert visibility timeout to number', async () => {
      const mockReceiptHandle = 'test-receipt-handle'
      const visibilityTimeout = 60

      mockSend.mockResolvedValue({})

      await sqsOperations.updateVisibilityTimeout(
        mockReceiptHandle,
        mockQueueUrl,
        visibilityTimeout
      )

      expect(mockSend).toHaveBeenCalledTimes(1)
      expect(mockChangeMessageVisibilityCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          VisibilityTimeout: 60
        })
      )
    })

    it('should handle zero visibility timeout', async () => {
      const mockReceiptHandle = 'test-receipt-handle'
      const visibilityTimeout = 0

      mockSend.mockResolvedValue({})

      await sqsOperations.updateVisibilityTimeout(
        mockReceiptHandle,
        mockQueueUrl,
        visibilityTimeout
      )

      expect(mockSend).toHaveBeenCalledTimes(1)
      expect(mockChangeMessageVisibilityCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          VisibilityTimeout: 0
        })
      )
    })

    it('should handle large visibility timeout', async () => {
      const mockReceiptHandle = 'test-receipt-handle'
      const visibilityTimeout = 43200 // 12 hours (maximum for SQS)

      mockSend.mockResolvedValue({})

      await sqsOperations.updateVisibilityTimeout(
        mockReceiptHandle,
        mockQueueUrl,
        visibilityTimeout
      )

      expect(mockSend).toHaveBeenCalledTimes(1)
      expect(mockChangeMessageVisibilityCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          VisibilityTimeout: 43200
        })
      )
    })

    it('should throw error when update fails', async () => {
      const mockReceiptHandle = 'test-receipt-handle'
      const visibilityTimeout = 300

      mockSend.mockRejectedValue(new Error('Update visibility timeout failed'))

      await expect(
        sqsOperations.updateVisibilityTimeout(mockReceiptHandle, mockQueueUrl, visibilityTimeout)
      ).rejects.toThrow('Update visibility timeout failed')
    })

    it('should handle invalid receipt handle gracefully', async () => {
      const mockReceiptHandle = 'invalid-receipt-handle'
      const visibilityTimeout = 300

      mockSend.mockRejectedValue(new Error('ReceiptHandleIsInvalid'))

      await expect(
        sqsOperations.updateVisibilityTimeout(mockReceiptHandle, mockQueueUrl, visibilityTimeout)
      ).rejects.toThrow('ReceiptHandleIsInvalid')
    })

    it('should handle expired receipt handle gracefully', async () => {
      const mockReceiptHandle = 'expired-receipt-handle'
      const visibilityTimeout = 300

      mockSend.mockRejectedValue(new Error('MessageNotInflight'))

      await expect(
        sqsOperations.updateVisibilityTimeout(mockReceiptHandle, mockQueueUrl, visibilityTimeout)
      ).rejects.toThrow('MessageNotInflight')
    })

    it('should handle complex receipt handle strings', async () => {
      const complexReceiptHandle
        = 'AQEBwJnKyrHigUMZBYhwLWZ+...[very-long-receipt-handle]...==|...'
      const visibilityTimeout = 180

      mockSend.mockResolvedValue({})

      await sqsOperations.updateVisibilityTimeout(
        complexReceiptHandle,
        mockQueueUrl,
        visibilityTimeout
      )

      expect(mockSend).toHaveBeenCalledTimes(1)
      expect(mockChangeMessageVisibilityCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          ReceiptHandle: complexReceiptHandle
        })
      )
    })
  })

  describe('constructor', () => {
    it('should initialize SQS client with correct region', () => {
      const testSqsOperations = new SQSOperations('us-west-2')

      expect(testSqsOperations).toBeInstanceOf(SQSOperations)
      expect(mockSQS).toHaveBeenCalledWith({ region: 'us-west-2' })
    })

    it('should initialize with different regions', () => {
      const regions = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-south-1']

      regions.forEach((region) => {
        jest.clearAllMocks()
        new SQSOperations(region)
        expect(mockSQS).toHaveBeenCalledWith({ region })
      })
    })
  })
})
