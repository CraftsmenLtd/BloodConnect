import { DynamoDBDocumentClient, UpdateCommand, PutCommand } from '@aws-sdk/lib-dynamodb'
import { mockClient } from 'aws-sdk-client-mock'
import DonorSearchDynamoDbOperations from '../../../commons/ddbOperations/DonorSearchDynamoDbOperations'
import type { DonorSearchDTO } from '../../../../../../commons/dto/DonationDTO'
import { DonorSearchStatus } from '../../../../../../commons/dto/DonationDTO'

describe('DonorSearchDynamoDbOperations createdAt handling', () => {
  const ddbMock = mockClient(DynamoDBDocumentClient)
  const operations = new DonorSearchDynamoDbOperations('TestTable', 'ap-south-1')

  const existingRecord: DonorSearchDTO = {
    seekerId: 'seeker-1',
    requestPostId: 'req-1',
    createdAt: '2026-06-01T00:00:00.000Z',
    status: DonorSearchStatus.PENDING,
    notifiedEligibleDonors: {}
  }

  beforeEach(() => {
    ddbMock.reset()
  })

  test('should not write createdAt back to the record on update', async() => {
    ddbMock.on(UpdateCommand).resolves({ $metadata: { httpStatusCode: 200 } })

    await operations.update({ ...existingRecord, currentRetryCount: 2 })

    const updateInput = ddbMock.commandCalls(UpdateCommand)[0].args[0].input
    expect(Object.values(updateInput.ExpressionAttributeNames ?? {})).not.toContain('createdAt')
    expect(updateInput.ExpressionAttributeValues ?? {}).not.toHaveProperty(':pcreatedAt')
    expect(Object.values(updateInput.ExpressionAttributeNames ?? {})).toContain('currentRetryCount')
  })

  test('should address the existing row by its original createdAt on update', async() => {
    ddbMock.on(UpdateCommand).resolves({ $metadata: { httpStatusCode: 200 } })

    await operations.update({ ...existingRecord, currentRetryCount: 2 })

    const updateInput = ddbMock.commandCalls(UpdateCommand)[0].args[0].input
    expect(updateInput.Key).toEqual({
      PK: 'DONOR_SEARCH#seeker-1',
      SK: 'DONOR_SEARCH#2026-06-01T00:00:00.000Z#req-1'
    })
  })

  test('should still write createdAt when the record is first created', async() => {
    ddbMock.on(PutCommand).resolves({ $metadata: { httpStatusCode: 200 } })

    await operations.create(existingRecord)

    const putInput = ddbMock.commandCalls(PutCommand)[0].args[0].input
    expect(putInput.Item).toEqual(
      expect.objectContaining({ createdAt: '2026-06-01T00:00:00.000Z' })
    )
  })
})
