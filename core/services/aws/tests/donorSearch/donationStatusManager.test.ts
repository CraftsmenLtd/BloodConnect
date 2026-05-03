import type { SQSEvent } from 'aws-lambda'
import donationStatusManager from '../../donorSearch/donationStatusManager'
import { BloodDonationService } from '../../../../application/bloodDonationWorkflow/BloodDonationService'
import { AcceptDonationService } from '../../../../application/bloodDonationWorkflow/AcceptDonationRequestService'
import { UNKNOWN_ERROR_MESSAGE } from '../../../../../commons/libs/constants/ApiResponseMessages'

jest.mock('../../../../application/bloodDonationWorkflow/BloodDonationService')
jest.mock('../../../../application/bloodDonationWorkflow/AcceptDonationRequestService')
jest.mock('../../commons/logger/ServiceLogger', () => ({
  createServiceLogger: jest.fn(() => ({
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }))
}))

const mockBloodDonationService = BloodDonationService as jest.MockedClass<typeof BloodDonationService>

describe('donationStatusManager', () => {
  const mockSQSEvent: SQSEvent = {
    Records: [
      {
        messageId: 'test-message-id',
        receiptHandle: 'test-receipt-handle',
        body: JSON.stringify({
          PK: 'USER#test-seeker-id',
          SK: 'DONATION_REQUEST#test-request-post-id',
          createdAt: '2024-01-01T00:00:00.000Z'
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

  it('should successfully process donation status update and return success', async () => {
    mockBloodDonationService.prototype.checkAndUpdateDonationStatus.mockResolvedValue(undefined)

    const result = await donationStatusManager(mockSQSEvent)

    expect(result).toEqual({ status: 'Success' })
    expect(mockBloodDonationService.prototype.checkAndUpdateDonationStatus).toHaveBeenCalledWith(
      'test-seeker-id',
      'test-request-post-id',
      '2024-01-01T00:00:00.000Z',
      expect.any(AcceptDonationService)
    )
  })

  it('should process multiple records successfully', async () => {
    const multiRecordEvent: SQSEvent = {
      Records: [
        {
          ...mockSQSEvent.Records[0],
          body: JSON.stringify({
            PK: 'USER#seeker-1',
            SK: 'DONATION_REQUEST#request-1',
            createdAt: '2024-01-01T00:00:00.000Z'
          })
        },
        {
          ...mockSQSEvent.Records[0],
          messageId: 'test-message-id-2',
          body: JSON.stringify({
            PK: 'USER#seeker-2',
            SK: 'DONATION_REQUEST#request-2',
            createdAt: '2024-01-02T00:00:00.000Z'
          })
        }
      ]
    }

    mockBloodDonationService.prototype.checkAndUpdateDonationStatus.mockResolvedValue(undefined)

    const result = await donationStatusManager(multiRecordEvent)

    expect(result).toEqual({ status: 'Success' })
    expect(mockBloodDonationService.prototype.checkAndUpdateDonationStatus).toHaveBeenCalledTimes(2)
    expect(mockBloodDonationService.prototype.checkAndUpdateDonationStatus).toHaveBeenNthCalledWith(
      1,
      'seeker-1',
      'request-1',
      '2024-01-01T00:00:00.000Z',
      expect.any(AcceptDonationService)
    )
    expect(mockBloodDonationService.prototype.checkAndUpdateDonationStatus).toHaveBeenNthCalledWith(
      2,
      'seeker-2',
      'request-2',
      '2024-01-02T00:00:00.000Z',
      expect.any(AcceptDonationService)
    )
  })

  it('should throw error when PK is empty', async () => {
    const eventWithEmptyPK: SQSEvent = {
      Records: [
        {
          ...mockSQSEvent.Records[0],
          body: JSON.stringify({
            PK: '',
            SK: 'DONATION_REQUEST#test-request-post-id',
            createdAt: '2024-01-01T00:00:00.000Z'
          })
        }
      ]
    }

    await expect(donationStatusManager(eventWithEmptyPK)).rejects.toThrow(
      'Missing PK or SK in the DynamoDB record'
    )
  })

  it('should throw error when SK is empty', async () => {
    const eventWithEmptySK: SQSEvent = {
      Records: [
        {
          ...mockSQSEvent.Records[0],
          body: JSON.stringify({
            PK: 'USER#test-seeker-id',
            SK: '',
            createdAt: '2024-01-01T00:00:00.000Z'
          })
        }
      ]
    }

    await expect(donationStatusManager(eventWithEmptySK)).rejects.toThrow(
      'Missing PK or SK in the DynamoDB record'
    )
  })

  it('should throw error when both PK and SK are empty', async () => {
    const eventWithEmptyKeys: SQSEvent = {
      Records: [
        {
          ...mockSQSEvent.Records[0],
          body: JSON.stringify({
            PK: '',
            SK: '',
            createdAt: '2024-01-01T00:00:00.000Z'
          })
        }
      ]
    }

    await expect(donationStatusManager(eventWithEmptyKeys)).rejects.toThrow(
      'Missing PK or SK in the DynamoDB record'
    )
  })

  it('should handle Error instances and rethrow', async () => {
    const errorMessage = 'Database connection failed'
    const error = new Error(errorMessage)
    mockBloodDonationService.prototype.checkAndUpdateDonationStatus.mockRejectedValue(error)

    await expect(donationStatusManager(mockSQSEvent)).rejects.toThrow(error)
  })

  it('should handle non-Error objects and wrap in Error', async () => {
    const nonErrorObject = { random: 'error' }
    mockBloodDonationService.prototype.checkAndUpdateDonationStatus.mockRejectedValue(
      nonErrorObject
    )

    await expect(donationStatusManager(mockSQSEvent)).rejects.toThrow(
      new Error(UNKNOWN_ERROR_MESSAGE)
    )
  })

  it('should parse PK correctly to extract seekerId', async () => {
    const eventWithComplexPK: SQSEvent = {
      Records: [
        {
          ...mockSQSEvent.Records[0],
          body: JSON.stringify({
            PK: 'USER#complex-seeker-id-with-dashes',
            SK: 'DONATION_REQUEST#request-id',
            createdAt: '2024-01-01T00:00:00.000Z'
          })
        }
      ]
    }

    mockBloodDonationService.prototype.checkAndUpdateDonationStatus.mockResolvedValue(undefined)

    await donationStatusManager(eventWithComplexPK)

    expect(mockBloodDonationService.prototype.checkAndUpdateDonationStatus).toHaveBeenCalledWith(
      'complex-seeker-id-with-dashes',
      'request-id',
      '2024-01-01T00:00:00.000Z',
      expect.any(AcceptDonationService)
    )
  })

  it('should parse SK correctly to extract requestPostId', async () => {
    const eventWithComplexSK: SQSEvent = {
      Records: [
        {
          ...mockSQSEvent.Records[0],
          body: JSON.stringify({
            PK: 'USER#seeker-id',
            SK: 'DONATION_REQUEST#complex-request-post-id-with-dashes',
            createdAt: '2024-01-01T00:00:00.000Z'
          })
        }
      ]
    }

    mockBloodDonationService.prototype.checkAndUpdateDonationStatus.mockResolvedValue(undefined)

    await donationStatusManager(eventWithComplexSK)

    expect(mockBloodDonationService.prototype.checkAndUpdateDonationStatus).toHaveBeenCalledWith(
      'seeker-id',
      'complex-request-post-id-with-dashes',
      '2024-01-01T00:00:00.000Z',
      expect.any(AcceptDonationService)
    )
  })

  it('should handle empty body as empty object and throw error', async () => {
    const eventWithEmptyBody: SQSEvent = {
      Records: [
        {
          ...mockSQSEvent.Records[0],
          body: ''
        }
      ]
    }

    await expect(donationStatusManager(eventWithEmptyBody)).rejects.toThrow()
  })

  it('should handle whitespace-only body as empty object and throw error', async () => {
    const eventWithWhitespaceBody: SQSEvent = {
      Records: [
        {
          ...mockSQSEvent.Records[0],
          body: '   '
        }
      ]
    }

    await expect(donationStatusManager(eventWithWhitespaceBody)).rejects.toThrow()
  })

  it('should pass createdAt to checkAndUpdateDonationStatus', async () => {
    const eventWithDifferentCreatedAt: SQSEvent = {
      Records: [
        {
          ...mockSQSEvent.Records[0],
          body: JSON.stringify({
            PK: 'USER#test-seeker-id',
            SK: 'DONATION_REQUEST#test-request-post-id',
            createdAt: '2024-12-31T23:59:59.999Z'
          })
        }
      ]
    }

    mockBloodDonationService.prototype.checkAndUpdateDonationStatus.mockResolvedValue(undefined)

    await donationStatusManager(eventWithDifferentCreatedAt)

    expect(mockBloodDonationService.prototype.checkAndUpdateDonationStatus).toHaveBeenCalledWith(
      'test-seeker-id',
      'test-request-post-id',
      '2024-12-31T23:59:59.999Z',
      expect.any(AcceptDonationService)
    )
  })
})
