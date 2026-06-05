import type { SQSEvent } from 'aws-lambda'
import donationRequestInitiatorLambda from '../../donorSearch/donationRequestInitiator'
import { DonorSearchService } from '../../../../application/bloodDonationWorkflow/DonorSearchService'
import SQSOperations from '../../commons/sqs/SQSOperations'
import { DonorSearchIntentionalError } from '../../../../application/bloodDonationWorkflow/DonorSearchOperationalError'

jest.mock('../../../../application/bloodDonationWorkflow/DonorSearchService')
jest.mock('../../commons/sqs/SQSOperations')
jest.mock('../../commons/logger/ServiceLogger', () => ({
  createServiceLogger: jest.fn(() => ({
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }))
}))

const mockDonorSearchService = DonorSearchService as jest.MockedClass<typeof DonorSearchService>

describe('donationRequestInitiatorLambda', () => {
  const mockSQSEvent: SQSEvent = {
    Records: [
      {
        messageId: 'test-message-id',
        receiptHandle: 'test-receipt-handle',
        body: JSON.stringify({
          PK: 'USER#test-seeker-id',
          SK: 'DONATION_REQUEST#2024-01-01T00:00:00.000Z#test-request-post-id',
          geohash: 'abc123',
          status: 'PENDING',
          eventName: 'INSERT'
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

  it('should successfully initiate donation request', async () => {
    mockDonorSearchService.prototype.initiateDonorSearchRequest.mockResolvedValue(undefined)

    await expect(donationRequestInitiatorLambda(mockSQSEvent)).resolves.not.toThrow()

    expect(mockDonorSearchService.prototype.initiateDonorSearchRequest).toHaveBeenCalledWith(
      {
        seekerId: 'test-seeker-id',
        requestPostId: 'test-request-post-id',
        createdAt: '2024-01-01T00:00:00.000Z',
        geohash: 'abc123'
      },
      expect.any(SQSOperations),
      'PENDING',
      'INSERT'
    )
  })

  it('should process multiple records in the event', async () => {
    const multiRecordEvent: SQSEvent = {
      Records: [
        {
          ...mockSQSEvent.Records[0],
          body: JSON.stringify({
            PK: 'USER#seeker-1',
            SK: 'DONATION_REQUEST#2024-01-01T00:00:00.000Z#request-1',
            geohash: 'abc123',
            status: 'PENDING',
            eventName: 'INSERT'
          })
        },
        {
          ...mockSQSEvent.Records[0],
          messageId: 'test-message-id-2',
          body: JSON.stringify({
            PK: 'USER#seeker-2',
            SK: 'DONATION_REQUEST#2024-01-02T00:00:00.000Z#request-2',
            geohash: 'xyz789',
            status: 'ACTIVE',
            eventName: 'MODIFY'
          })
        }
      ]
    }

    mockDonorSearchService.prototype.initiateDonorSearchRequest.mockResolvedValue(undefined)

    await donationRequestInitiatorLambda(multiRecordEvent)

    expect(mockDonorSearchService.prototype.initiateDonorSearchRequest).toHaveBeenCalledTimes(2)
    expect(mockDonorSearchService.prototype.initiateDonorSearchRequest).toHaveBeenNthCalledWith(
      1,
      {
        seekerId: 'seeker-1',
        requestPostId: 'request-1',
        createdAt: '2024-01-01T00:00:00.000Z',
        geohash: 'abc123'
      },
      expect.any(SQSOperations),
      'PENDING',
      'INSERT'
    )
    expect(mockDonorSearchService.prototype.initiateDonorSearchRequest).toHaveBeenNthCalledWith(
      2,
      {
        seekerId: 'seeker-2',
        requestPostId: 'request-2',
        createdAt: '2024-01-02T00:00:00.000Z',
        geohash: 'xyz789'
      },
      expect.any(SQSOperations),
      'ACTIVE',
      'MODIFY'
    )
  })

  it('should handle DonorSearchIntentionalError and rethrow', async () => {
    const intentionalError = new DonorSearchIntentionalError('Intentional error occurred')
    mockDonorSearchService.prototype.initiateDonorSearchRequest.mockRejectedValue(intentionalError)

    await expect(donationRequestInitiatorLambda(mockSQSEvent)).rejects.toThrow(intentionalError)
  })

  it('should handle generic Error and rethrow', async () => {
    const genericError = new Error('Generic error occurred')
    mockDonorSearchService.prototype.initiateDonorSearchRequest.mockRejectedValue(genericError)

    await expect(donationRequestInitiatorLambda(mockSQSEvent)).rejects.toThrow(genericError)
  })

  it('should parse PK and SK correctly to extract seekerId, requestPostId, and createdAt', async () => {
    const eventWithComplexKeys: SQSEvent = {
      Records: [
        {
          ...mockSQSEvent.Records[0],
          body: JSON.stringify({
            PK: 'USER#complex-seeker-id-with-dashes',
            SK: 'DONATION_REQUEST#2024-12-31T23:59:59.999Z#complex-request-post-id',
            geohash: 'complex123',
            status: 'ACTIVE',
            eventName: 'INSERT'
          })
        }
      ]
    }

    mockDonorSearchService.prototype.initiateDonorSearchRequest.mockResolvedValue(undefined)

    await donationRequestInitiatorLambda(eventWithComplexKeys)

    expect(mockDonorSearchService.prototype.initiateDonorSearchRequest).toHaveBeenCalledWith(
      {
        seekerId: 'complex-seeker-id-with-dashes',
        requestPostId: 'complex-request-post-id',
        createdAt: '2024-12-31T23:59:59.999Z',
        geohash: 'complex123'
      },
      expect.any(SQSOperations),
      'ACTIVE',
      'INSERT'
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

    mockDonorSearchService.prototype.initiateDonorSearchRequest.mockResolvedValue(undefined)

    await expect(donationRequestInitiatorLambda(eventWithEmptyBody)).rejects.toThrow()
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

    mockDonorSearchService.prototype.initiateDonorSearchRequest.mockResolvedValue(undefined)

    await expect(donationRequestInitiatorLambda(eventWithWhitespaceBody)).rejects.toThrow()
  })

  it('should handle MODIFY event name', async () => {
    const modifyEvent: SQSEvent = {
      Records: [
        {
          ...mockSQSEvent.Records[0],
          body: JSON.stringify({
            PK: 'USER#test-seeker-id',
            SK: 'DONATION_REQUEST#2024-01-01T00:00:00.000Z#test-request-post-id',
            geohash: 'abc123',
            status: 'ACTIVE',
            eventName: 'MODIFY'
          })
        }
      ]
    }

    mockDonorSearchService.prototype.initiateDonorSearchRequest.mockResolvedValue(undefined)

    await donationRequestInitiatorLambda(modifyEvent)

    expect(mockDonorSearchService.prototype.initiateDonorSearchRequest).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(SQSOperations),
      'ACTIVE',
      'MODIFY'
    )
  })

  it('should handle REMOVE event name', async () => {
    const removeEvent: SQSEvent = {
      Records: [
        {
          ...mockSQSEvent.Records[0],
          body: JSON.stringify({
            PK: 'USER#test-seeker-id',
            SK: 'DONATION_REQUEST#2024-01-01T00:00:00.000Z#test-request-post-id',
            geohash: 'abc123',
            status: 'CANCELLED',
            eventName: 'REMOVE'
          })
        }
      ]
    }

    mockDonorSearchService.prototype.initiateDonorSearchRequest.mockResolvedValue(undefined)

    await donationRequestInitiatorLambda(removeEvent)

    expect(mockDonorSearchService.prototype.initiateDonorSearchRequest).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(SQSOperations),
      'CANCELLED',
      'REMOVE'
    )
  })
})
