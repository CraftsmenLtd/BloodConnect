import type { SQSEvent } from 'aws-lambda'
import { DonorSearchService } from '../../../../application/bloodDonationWorkflow/DonorSearchService'
import SQSOperations from '../../commons/sqs/SQSOperations'
import { DonorSearchIntentionalError, DonorSearchOperationalError } from '../../../../application/bloodDonationWorkflow/DonorSearchOperationalError'
import { GeohashCacheManager } from '../../../../application/utils/GeohashCacheMapManager'

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
jest.mock('../../../../../commons/libs/config/config', () => ({
  Config: jest.fn().mockImplementation(() => ({
    getConfig: jest.fn().mockReturnValue({
      dynamodbTableName: 'test-table',
      awsRegion: 'us-east-1',
      donorSearchQueueUrl: 'test-queue-url',
      maxGeohashCacheEntriesCount: 1000,
      maxGeohashCacheMbSize: 10,
      maxGeohashCacheTimeoutMinutes: 30,
      maxDonorSearchDepth: 5,
      maxDonorSearchIterationsInASingleLambda: 10
    })
  }))
}))

import donorSearchLambda from '../../donorSearch/donorSearch'

const mockDonorSearchService = DonorSearchService as jest.MockedClass<typeof DonorSearchService>

describe('donorSearchLambda', () => {
  const mockSQSEvent: SQSEvent = {
    Records: [
      {
        messageId: 'test-message-id',
        receiptHandle: 'test-receipt-handle',
        body: JSON.stringify({
          seekerId: 'test-seeker-id',
          requestPostId: 'test-request-post-id',
          createdAt: '2024-01-01T00:00:00.000Z',
          targetedExecutionTime: 1704067200000,
          remainingDonorsToFind: 5,
          currentNeighborSearchLevel: 1,
          remainingGeohashesToProcess: ['abc123'],
          initiationCount: 1,
          notifiedEligibleDonors: []
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

  it('should successfully process donor search request', async () => {
    mockDonorSearchService.prototype.searchDonors.mockResolvedValue(undefined)

    await expect(donorSearchLambda(mockSQSEvent)).resolves.not.toThrow()

    expect(mockDonorSearchService.prototype.searchDonors).toHaveBeenCalledWith(
      expect.objectContaining({
        seekerId: 'test-seeker-id',
        requestPostId: 'test-request-post-id',
        createdAt: '2024-01-01T00:00:00.000Z',
        targetedExecutionTime: 1704067200000,
        remainingDonorsToFind: 5,
        currentNeighborSearchLevel: 1,
        remainingGeohashesToProcess: ['abc123'],
        initiationCount: 1,
        notifiedEligibleDonors: [],
        receiptHandle: 'test-receipt-handle'
      })
    )
  })

  it('should handle DonorSearchIntentionalError and rethrow', async () => {
    const intentionalError = new DonorSearchIntentionalError('Intentional error occurred')
    mockDonorSearchService.prototype.searchDonors.mockRejectedValue(intentionalError)

    await expect(donorSearchLambda(mockSQSEvent)).rejects.toThrow(intentionalError)
  })

  it('should handle DonorSearchOperationalError and rethrow', async () => {
    const operationalError = new DonorSearchOperationalError('Operational error occurred')
    mockDonorSearchService.prototype.searchDonors.mockRejectedValue(operationalError)

    await expect(donorSearchLambda(mockSQSEvent)).rejects.toThrow(operationalError)
  })

  it('should handle generic Error and rethrow', async () => {
    const genericError = new Error('Generic error occurred')
    mockDonorSearchService.prototype.searchDonors.mockRejectedValue(genericError)

    await expect(donorSearchLambda(mockSQSEvent)).rejects.toThrow(genericError)
  })

  it('should parse SQS event body correctly with all attributes', async () => {
    const complexMockEvent: SQSEvent = {
      Records: [
        {
          ...mockSQSEvent.Records[0],
          body: JSON.stringify({
            seekerId: 'complex-seeker-id',
            requestPostId: 'complex-request-post-id',
            createdAt: '2024-02-01T00:00:00.000Z',
            targetedExecutionTime: 1706745600000,
            remainingDonorsToFind: 10,
            currentNeighborSearchLevel: 2,
            remainingGeohashesToProcess: ['xyz789', 'abc123'],
            initiationCount: 3,
            notifiedEligibleDonors: ['donor1', 'donor2']
          })
        }
      ]
    }

    mockDonorSearchService.prototype.searchDonors.mockResolvedValue(undefined)

    await donorSearchLambda(complexMockEvent)

    expect(mockDonorSearchService.prototype.searchDonors).toHaveBeenCalledWith(
      expect.objectContaining({
        seekerId: 'complex-seeker-id',
        requestPostId: 'complex-request-post-id',
        createdAt: '2024-02-01T00:00:00.000Z',
        remainingDonorsToFind: 10,
        currentNeighborSearchLevel: 2,
        remainingGeohashesToProcess: ['xyz789', 'abc123'],
        initiationCount: 3,
        notifiedEligibleDonors: ['donor1', 'donor2']
      })
    )
  })

  it('should handle empty notifiedEligibleDonors array', async () => {
    const eventWithEmptyDonors: SQSEvent = {
      Records: [
        {
          ...mockSQSEvent.Records[0],
          body: JSON.stringify({
            seekerId: 'test-seeker-id',
            requestPostId: 'test-request-post-id',
            createdAt: '2024-01-01T00:00:00.000Z',
            targetedExecutionTime: 1704067200000,
            remainingDonorsToFind: 5,
            currentNeighborSearchLevel: 1,
            remainingGeohashesToProcess: ['abc123'],
            initiationCount: 1,
            notifiedEligibleDonors: []
          })
        }
      ]
    }

    mockDonorSearchService.prototype.searchDonors.mockResolvedValue(undefined)

    await donorSearchLambda(eventWithEmptyDonors)

    expect(mockDonorSearchService.prototype.searchDonors).toHaveBeenCalledWith(
      expect.objectContaining({
        notifiedEligibleDonors: []
      })
    )
  })

  it('should pass correct services and dependencies to searchDonors', async () => {
    mockDonorSearchService.prototype.searchDonors.mockResolvedValue(undefined)

    await donorSearchLambda(mockSQSEvent)

    expect(mockDonorSearchService.prototype.searchDonors).toHaveBeenCalledWith(
      expect.objectContaining({
        bloodDonationService: expect.any(Object),
        acceptDonationService: expect.any(Object),
        notificationService: expect.any(Object),
        geohashService: expect.any(Object),
        queueModel: expect.any(SQSOperations),
        geohashCache: expect.any(GeohashCacheManager)
      })
    )
  })
})
