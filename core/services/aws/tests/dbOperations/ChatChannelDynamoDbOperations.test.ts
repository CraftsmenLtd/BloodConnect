import ChatChannelDynamoDbOperations from '../../commons/ddbOperations/ChatChannelDynamoDbOperations'
import {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
  TransactWriteCommand,
  UpdateCommand
} from '@aws-sdk/lib-dynamodb'
import { TransactionCanceledException } from '@aws-sdk/client-dynamodb'
import { mockClient } from 'aws-sdk-client-mock'
import type { ChatChannelDTO } from '../../../../../commons/dto/ChatDTO'

const TABLE = 'TestTable'
const REGION = 'ap-south-1'

const channel: ChatChannelDTO = {
  channelId: 'seeker1#req1#donor1',
  seekerId: 'seeker1',
  donorId: 'donor1',
  requestPostId: 'req1',
  status: 'ACTIVE',
  createdAt: '2026-06-26T10:00:00.000Z'
}

describe('ChatChannelDynamoDbOperations', () => {
  const ddbMock = mockClient(DynamoDBDocumentClient)
  const ops = new ChatChannelDynamoDbOperations(TABLE, REGION)

  beforeEach(() => {
    ddbMock.reset()
  })

  describe('createChannel', () => {
    test('writes the channel row plus both inbox pointers in one transaction', async() => {
      ddbMock.on(TransactWriteCommand).resolves({ $metadata: { httpStatusCode: 200 } })

      const result = await ops.createChannel(channel)

      expect(result.channelId).toBe(channel.channelId)
      const input = ddbMock.commandCalls(TransactWriteCommand)[0].args[0].input
      expect(input.TransactItems).toHaveLength(3)
      expect(input.TransactItems?.[0].Put?.ConditionExpression).toBe('attribute_not_exists(PK)')
      expect(input.TransactItems?.[0].Put?.Item?.PK).toBe('CHAT#seeker1#req1#donor1')
    })

    test('is idempotent — a cancelled transaction does not throw or overwrite', async() => {
      ddbMock.on(TransactWriteCommand).rejects(
        new TransactionCanceledException({ message: 'cancelled', $metadata: {} })
      )

      const result = await ops.createChannel(channel)

      expect(result.channelId).toBe(channel.channelId)
      expect(ddbMock.commandCalls(TransactWriteCommand)).toHaveLength(1)
    })

    test('rethrows non-conditional transaction errors', async() => {
      ddbMock.on(TransactWriteCommand).rejects(new Error('boom'))

      await expect(ops.createChannel(channel)).rejects.toThrow('boom')
    })
  })

  describe('getChannel', () => {
    test('returns the channel when present', async() => {
      ddbMock.on(GetCommand).resolves({
        Item: {
          PK: 'CHAT#seeker1#req1#donor1',
          SK: 'METADATA',
          seekerId: 'seeker1',
          donorId: 'donor1',
          requestPostId: 'req1',
          status: 'ACTIVE',
          createdAt: channel.createdAt,
          expiresAt: 1790000000
        }
      })

      const result = await ops.getChannel(channel.channelId)

      expect(result?.channelId).toBe(channel.channelId)
      const input = ddbMock.commandCalls(GetCommand)[0].args[0].input
      expect(input.Key).toEqual({ PK: 'CHAT#seeker1#req1#donor1', SK: 'METADATA' })
    })

    test('returns null when not found', async() => {
      ddbMock.on(GetCommand).resolves({ Item: undefined })

      const result = await ops.getChannel(channel.channelId)

      expect(result).toBeNull()
    })
  })

  describe('listChannelsForUser', () => {
    test('queries the user partition with a CHAT# sort-key prefix', async() => {
      ddbMock.on(QueryCommand).resolves({ Items: [{ PK: 'USER#donor1', SK: 'CHAT#seeker1#req1#donor1' }] })

      const result = await ops.listChannelsForUser('donor1')

      expect(result).toHaveLength(1)
      const input = ddbMock.commandCalls(QueryCommand)[0].args[0].input
      expect(input.ExpressionAttributeValues).toEqual({ ':pk': 'USER#donor1', ':sk': 'CHAT#' })
    })

    test('returns an empty list when the user has no channels', async() => {
      ddbMock.on(QueryCommand).resolves({ Items: [] })

      const result = await ops.listChannelsForUser('donor1')

      expect(result).toEqual([])
    })
  })

  describe('listChannelsForRequest', () => {
    test('filters to the (seekerId, requestPostId) sort-key prefix', async() => {
      ddbMock.on(QueryCommand).resolves({ Items: [{ PK: 'USER#seeker1', SK: 'CHAT#seeker1#req1#donor1' }] })

      const result = await ops.listChannelsForRequest('seeker1', 'req1')

      expect(result).toHaveLength(1)
      const input = ddbMock.commandCalls(QueryCommand)[0].args[0].input
      expect(input.ExpressionAttributeValues).toEqual({
        ':pk': 'USER#seeker1',
        ':sk': 'CHAT#seeker1#req1#'
      })
    })
  })

  describe('lockChannel', () => {
    test('sets status to LOCKED guarded by attribute_exists', async() => {
      ddbMock.on(UpdateCommand).resolves({ $metadata: { httpStatusCode: 200 } })

      await ops.lockChannel(channel.channelId)

      const input = ddbMock.commandCalls(UpdateCommand)[0].args[0].input
      expect(input.ConditionExpression).toBe('attribute_exists(PK)')
      expect(input.ExpressionAttributeValues?.[':locked']).toBe('LOCKED')
      expect(input.Key).toEqual({ PK: 'CHAT#seeker1#req1#donor1', SK: 'METADATA' })
    })
  })

  describe('incrementUnread', () => {
    test('atomically adds one to unreadCount and sets the preview', async() => {
      ddbMock.on(UpdateCommand).resolves({ $metadata: { httpStatusCode: 200 } })

      await ops.incrementUnread('donor1', channel.channelId, 'hi there')

      const input = ddbMock.commandCalls(UpdateCommand)[0].args[0].input
      expect(input.UpdateExpression).toBe('SET lastMessagePreview = :preview ADD unreadCount :inc')
      expect(input.ExpressionAttributeValues).toEqual({ ':preview': 'hi there', ':inc': 1 })
      expect(input.Key).toEqual({ PK: 'USER#donor1', SK: 'CHAT#seeker1#req1#donor1' })
    })
  })

  describe('resetUnread', () => {
    test('zeroes the pointer unreadCount', async() => {
      ddbMock.on(UpdateCommand).resolves({ $metadata: { httpStatusCode: 200 } })

      await ops.resetUnread('donor1', channel.channelId)

      const input = ddbMock.commandCalls(UpdateCommand)[0].args[0].input
      expect(input.UpdateExpression).toBe('SET unreadCount = :zero')
      expect(input.ExpressionAttributeValues).toEqual({ ':zero': 0 })
    })
  })
})
