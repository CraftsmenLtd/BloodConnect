import type { DynamoDBStreamEvent } from 'aws-lambda'
import chatChannelCreator from '../../chat/chatChannelCreator'
import { ChannelLifecycleService } from '../../../../application/chatWorkflow/ChannelLifecycleService'

jest.mock('../../../../application/chatWorkflow/ChannelLifecycleService')
jest.mock('../../commons/logger/ServiceLogger', () => ({
  createServiceLogger: () => ({ info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() })
}))

const mockLifecycle = ChannelLifecycleService as jest.MockedClass<typeof ChannelLifecycleService>

const streamEvent = (
  records: { newImage: Record<string, unknown>; eventName: string; sequenceNumber: string }[]
): DynamoDBStreamEvent =>
  ({
    Records: records.map((record) => ({
      eventName: record.eventName,
      dynamodb: { NewImage: record.newImage, SequenceNumber: record.sequenceNumber }
    }))
  }) as unknown as DynamoDBStreamEvent

describe('chatChannelCreator stream handler', () => {
  afterEach(() => jest.clearAllMocks())

  it('creates a channel for an ACCEPTED acceptance record', async () => {
    const result = await chatChannelCreator(
      streamEvent([
        {
          eventName: 'INSERT',
          sequenceNumber: '1',
          newImage: {
            PK: { S: 'BLOOD_REQ#seeker-1' },
            SK: { S: 'ACCEPTED#req-1#donor-1' },
            status: { S: 'ACCEPTED' },
            createdAt: { S: '2026-06-26T00:00:00.000Z' }
          }
        }
      ])
    )

    expect(mockLifecycle.prototype.onAcceptanceAccepted).toHaveBeenCalledWith(
      { seekerId: 'seeker-1', requestPostId: 'req-1', donorId: 'donor-1', requestCreatedAt: '2026-06-26T00:00:00.000Z' },
      expect.anything(),
      expect.anything()
    )
    expect(result.batchItemFailures).toHaveLength(0)
  })

  it('locks channels for a COMPLETED donation-request record', async () => {
    await chatChannelCreator(
      streamEvent([
        {
          eventName: 'MODIFY',
          sequenceNumber: '2',
          newImage: {
            PK: { S: 'BLOOD_REQ#seeker-1' },
            SK: { S: 'BLOOD_REQ#2026-06-26T00:00:00.000Z#req-1' },
            status: { S: 'COMPLETED' }
          }
        }
      ])
    )

    expect(mockLifecycle.prototype.onRequestCompleted).toHaveBeenCalledWith(
      { seekerId: 'seeker-1', requestPostId: 'req-1' },
      expect.anything(),
      expect.anything()
    )
  })

  it('ignores unrelated records without failing them', async () => {
    const result = await chatChannelCreator(
      streamEvent([
        { eventName: 'INSERT', sequenceNumber: '3', newImage: { PK: { S: 'USER#x' }, SK: { S: 'PROFILE' } } }
      ])
    )

    expect(mockLifecycle.prototype.onAcceptanceAccepted).not.toHaveBeenCalled()
    expect(mockLifecycle.prototype.onRequestCompleted).not.toHaveBeenCalled()
    expect(result.batchItemFailures).toHaveLength(0)
  })

  it('reports a failing record in batchItemFailures for retry', async () => {
    mockLifecycle.prototype.onAcceptanceAccepted.mockRejectedValueOnce(new Error('boom'))

    const result = await chatChannelCreator(
      streamEvent([
        {
          eventName: 'INSERT',
          sequenceNumber: '42',
          newImage: {
            PK: { S: 'BLOOD_REQ#seeker-1' },
            SK: { S: 'ACCEPTED#req-1#donor-1' },
            status: { S: 'ACCEPTED' },
            createdAt: { S: '2026-06-26T00:00:00.000Z' }
          }
        }
      ])
    )

    expect(result.batchItemFailures).toEqual([{ itemIdentifier: '42' }])
  })
})
