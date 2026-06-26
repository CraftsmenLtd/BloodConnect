import ChatRateLimitDynamoDbOperations from '../../../commons/ddbOperations/ChatRateLimitDynamoDbOperations'
import {
  DynamoDBDocumentClient,
  UpdateCommand
} from '@aws-sdk/lib-dynamodb'
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb'
import { mockClient } from 'aws-sdk-client-mock'

const TABLE = 'TestTable'
const REGION = 'ap-south-1'
const CHANNEL_ID = 'seeker-1#req-1#donor-1'

describe('ChatRateLimitDynamoDbOperations', () => {
  const ddbMock = mockClient(DynamoDBDocumentClient)
  const operations = new ChatRateLimitDynamoDbOperations(TABLE, REGION)

  beforeEach(() => {
    ddbMock.reset()
  })

  test('allows a message via an atomic conditional increment with a TTL', async() => {
    ddbMock.on(UpdateCommand).resolves({})

    const allowed = await operations.tryConsume(CHANNEL_ID, 60, 60)

    expect(allowed).toBe(true)
    const input = ddbMock.commandCalls(UpdateCommand)[0].args[0].input
    expect(input.UpdateExpression).toContain('ADD #count :one')
    expect(input.ConditionExpression).toBe('attribute_not_exists(#count) OR #count < :limit')
    expect(input.ExpressionAttributeValues?.[':limit']).toBe(60)
    expect((input.Key as { PK: string }).PK).toBe(`CHATRATE#${CHANNEL_ID}`)
    expect(input.ExpressionAttributeValues?.[':ttl']).toBeGreaterThan(0)
  })

  test('rejects the 61st message in a window when the conditional check fails', async() => {
    ddbMock.on(UpdateCommand).rejects(
      new ConditionalCheckFailedException({ message: 'limit reached', $metadata: {} })
    )

    const allowed = await operations.tryConsume(CHANNEL_ID, 60, 60)

    expect(allowed).toBe(false)
  })

  test('rethrows unexpected errors', async() => {
    ddbMock.on(UpdateCommand).rejects(new Error('network'))

    await expect(operations.tryConsume(CHANNEL_ID, 60, 60)).rejects.toThrow('network')
  })
})
