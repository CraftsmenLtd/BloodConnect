import ChatMessageDynamoDbOperations from '../../commons/ddbOperations/ChatMessageDynamoDbOperations'
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  TransactWriteCommand
} from '@aws-sdk/lib-dynamodb'
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb'
import { mockClient } from 'aws-sdk-client-mock'
import type { ChatMessageDTO } from '../../../../../commons/dto/ChatDTO'

const TABLE = 'TestTable'
const REGION = 'ap-south-1'

const message: ChatMessageDTO = {
  channelId: 'seeker1#req1#donor1',
  messageId: 'm1',
  senderId: 'donor1',
  text: 'hello',
  createdAt: '2026-06-26T10:00:00.000Z',
  expiresAt: 1790000000
}

const messageItem = {
  PK: 'CHATMSG#seeker1#req1#donor1',
  SK: '2026-06-26T10:00:00.000Z#m1',
  senderId: 'donor1',
  text: 'hello',
  expiresAt: 1790000000
}

describe('ChatMessageDynamoDbOperations', () => {
  const ddbMock = mockClient(DynamoDBDocumentClient)
  const ops = new ChatMessageDynamoDbOperations(TABLE, REGION)

  beforeEach(() => {
    ddbMock.reset()
  })

  describe('addMessage', () => {
    test('writes the message with an attribute_not_exists(SK) dedupe guard', async() => {
      ddbMock.on(PutCommand).resolves({ $metadata: { httpStatusCode: 200 } })

      const result = await ops.addMessage(message)

      expect(result.messageId).toBe('m1')
      const input = ddbMock.commandCalls(PutCommand)[0].args[0].input
      expect(input.ConditionExpression).toBe('attribute_not_exists(SK)')
      expect(input.Item?.SK).toBe('2026-06-26T10:00:00.000Z#m1')
    })

    test('rejects a duplicate SK (re-sent messageId) via the conditional put', async() => {
      ddbMock.on(PutCommand).rejects(
        new ConditionalCheckFailedException({ message: 'exists', $metadata: {} })
      )

      await expect(ops.addMessage(message)).rejects.toThrow(ConditionalCheckFailedException)
    })

    test('applies a channel-status guard atomically via a transaction', async() => {
      ddbMock.on(TransactWriteCommand).resolves({ $metadata: { httpStatusCode: 200 } })

      await ops.addMessage(message, {
        conditionExpression: '#status = :active',
        expressionAttributeNames: { '#status': 'status' },
        expressionAttributeValues: { ':active': 'ACTIVE' }
      })

      const input = ddbMock.commandCalls(TransactWriteCommand)[0].args[0].input
      expect(input.TransactItems?.[0].ConditionCheck?.Key).toEqual({
        PK: 'CHAT#seeker1#req1#donor1',
        SK: 'METADATA'
      })
      expect(input.TransactItems?.[0].ConditionCheck?.ConditionExpression).toBe('#status = :active')
      expect(input.TransactItems?.[1].Put?.ConditionExpression).toBe('attribute_not_exists(SK)')
    })
  })

  describe('getHistory', () => {
    test('queries in reverse chronological order and returns the next cursor', async() => {
      const cursor = { PK: 'CHATMSG#seeker1#req1#donor1', SK: '2026-06-26T09:00:00.000Z#m0' }
      ddbMock.on(QueryCommand).resolves({ Items: [messageItem], LastEvaluatedKey: cursor })

      const result = await ops.getHistory(message.channelId, 20)

      expect(result.messages).toHaveLength(1)
      expect(result.messages[0].messageId).toBe('m1')
      expect(result.nextCursor).toEqual(cursor)
      const input = ddbMock.commandCalls(QueryCommand)[0].args[0].input
      expect(input.ScanIndexForward).toBe(false)
      expect(input.Limit).toBe(20)
    })

    test('passes the supplied cursor as ExclusiveStartKey', async() => {
      const cursor = { PK: 'CHATMSG#seeker1#req1#donor1', SK: '2026-06-26T09:00:00.000Z#m0' }
      ddbMock.on(QueryCommand).resolves({ Items: [] })

      const result = await ops.getHistory(message.channelId, 20, cursor)

      expect(result.nextCursor).toBeUndefined()
      const input = ddbMock.commandCalls(QueryCommand)[0].args[0].input
      expect(input.ExclusiveStartKey).toEqual(cursor)
    })
  })

  describe('countMessagesSince', () => {
    test('counts messages with createdAt at or after the epoch threshold', async() => {
      ddbMock.on(QueryCommand).resolves({ Count: 5 })

      const epochSeconds = Math.floor(Date.parse('2026-06-26T10:00:00.000Z') / 1000)
      const count = await ops.countMessagesSince(message.channelId, epochSeconds)

      expect(count).toBe(5)
      const input = ddbMock.commandCalls(QueryCommand)[0].args[0].input
      expect(input.Select).toBe('COUNT')
      expect(input.ExpressionAttributeValues?.[':sk']).toBe('2026-06-26T10:00:00.000Z')
    })

    test('returns zero when the partition is empty', async() => {
      ddbMock.on(QueryCommand).resolves({ Count: undefined })

      const count = await ops.countMessagesSince(message.channelId, 1_790_000_000)

      expect(count).toBe(0)
    })
  })
})
