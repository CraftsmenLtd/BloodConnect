import ChatDynamoDbOperations from '../../../commons/ddbOperations/ChatDynamoDbOperations'
import {
  DynamoDBDocumentClient,
  PutCommand,
  UpdateCommand,
  GetCommand,
  QueryCommand
} from '@aws-sdk/lib-dynamodb'
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb'
import { mockClient } from 'aws-sdk-client-mock'
import {
  ChatChannelStatus,
  ChatRole,
  buildChannelId
} from '../../../../../../commons/dto/ChatDTO'
import type {
  ChatChannelDTO,
  ChatMembershipDTO,
  ChatMessageDTO
} from '../../../../../../commons/dto/ChatDTO'

const TABLE = 'TestTable'
const REGION = 'ap-south-1'

describe('ChatDynamoDbOperations', () => {
  const ddbMock = mockClient(DynamoDBDocumentClient)
  const operations = new ChatDynamoDbOperations(TABLE, REGION)

  beforeEach(() => {
    ddbMock.reset()
  })

  describe('upsertChannelOpen', () => {
    const channel: ChatChannelDTO = {
      channelId: buildChannelId('seeker-1', 'req-1', 'donor-1'),
      seekerId: 'seeker-1',
      requestPostId: 'req-1',
      donorId: 'donor-1',
      status: ChatChannelStatus.OPEN,
      context: {
        requestedBloodGroup: 'O+',
        urgencyLevel: 'urgent',
        donationDateTime: '2026-06-30T10:00:00.000Z',
        location: 'Dhaka'
      },
      createdAt: '2026-06-26T00:00:00.000Z'
    }

    test('sets status OPEN and preserves createdAt via if_not_exists on the channel key', async() => {
      // ALL_NEW echoes the persisted item; the original createdAt differs from the caller's input
      // to prove the returned DTO reflects the stored (preserved) value on a re-open.
      ddbMock.on(UpdateCommand).resolves({
        Attributes: {
          PK: 'CHANNEL#seeker-1#req-1',
          SK: 'DONOR#donor-1',
          status: ChatChannelStatus.OPEN,
          context: channel.context,
          createdAt: '2026-06-20T00:00:00.000Z'
        }
      })

      const result = await operations.upsertChannelOpen(channel)

      const input = ddbMock.commandCalls(UpdateCommand)[0].args[0].input
      expect(input.Key).toEqual({ PK: 'CHANNEL#seeker-1#req-1', SK: 'DONOR#donor-1' })
      expect(input.UpdateExpression).toContain('#status = :status')
      expect(input.UpdateExpression).toContain('if_not_exists(#createdAt, :createdAt)')
      expect(input.ExpressionAttributeValues?.[':status']).toBe(ChatChannelStatus.OPEN)
      expect(input.ReturnValues).toBe('ALL_NEW')
      expect(result.status).toBe(ChatChannelStatus.OPEN)
      expect(result.createdAt).toBe('2026-06-20T00:00:00.000Z')
      expect(result.channelId).toBe('seeker-1#req-1#donor-1')
    })
  })

  describe('lockChannel', () => {
    test('locks an existing channel with attribute_exists guard', async() => {
      ddbMock.on(UpdateCommand).resolves({})

      await operations.lockChannel('seeker-1', 'req-1', 'donor-1')

      const input = ddbMock.commandCalls(UpdateCommand)[0].args[0].input
      expect(input.ConditionExpression).toBe('attribute_exists(PK)')
      expect(input.ExpressionAttributeValues?.[':status']).toBe(ChatChannelStatus.LOCKED)
    })

    test('is a safe no-op when the channel does not exist', async() => {
      ddbMock.on(UpdateCommand).rejects(
        new ConditionalCheckFailedException({ message: 'no item', $metadata: {} })
      )

      await expect(operations.lockChannel('seeker-1', 'req-1', 'absent')).resolves.toBeUndefined()
    })

    test('rethrows non-conditional errors', async() => {
      ddbMock.on(UpdateCommand).rejects(new Error('boom'))

      await expect(operations.lockChannel('seeker-1', 'req-1', 'donor-1')).rejects.toThrow('boom')
    })
  })

  describe('listChannelsForRequest', () => {
    test('queries all channels under the request PK and maps them to DTOs', async() => {
      ddbMock.on(QueryCommand).resolves({
        Items: [
          { PK: 'CHANNEL#seeker-1#req-1', SK: 'DONOR#donor-1', status: ChatChannelStatus.OPEN, context: {}, createdAt: 'x' },
          { PK: 'CHANNEL#seeker-1#req-1', SK: 'DONOR#donor-2', status: ChatChannelStatus.LOCKED, context: {}, createdAt: 'y' }
        ]
      })

      const channels = await operations.listChannelsForRequest('seeker-1', 'req-1')

      const input = ddbMock.commandCalls(QueryCommand)[0].args[0].input
      expect(input.ExpressionAttributeValues?.[':pk']).toBe('CHANNEL#seeker-1#req-1')
      expect(channels.map((c) => c.donorId)).toEqual(['donor-1', 'donor-2'])
    })
  })

  describe('getChannel', () => {
    test('returns null when the channel is absent', async() => {
      ddbMock.on(GetCommand).resolves({})

      expect(await operations.getChannel('seeker-1', 'req-1', 'donor-1')).toBeNull()
    })

    test('maps a found channel to a DTO', async() => {
      ddbMock.on(GetCommand).resolves({
        Item: {
          PK: 'CHANNEL#seeker-1#req-1',
          SK: 'DONOR#donor-1',
          status: ChatChannelStatus.OPEN,
          context: {},
          createdAt: 'x'
        }
      })

      const channel = await operations.getChannel('seeker-1', 'req-1', 'donor-1')
      expect(channel?.seekerId).toBe('seeker-1')
      expect(channel?.donorId).toBe('donor-1')
    })
  })

  describe('membership operations', () => {
    test('upsertMembership writes role under the user partition preserving createdAt', async() => {
      ddbMock.on(UpdateCommand).resolves({})
      const membership: ChatMembershipDTO = {
        userId: 'user-1',
        channelId: 'seeker-1#req-1#donor-1',
        role: ChatRole.DONOR,
        createdAt: '2026-06-26T00:00:00.000Z'
      }

      await operations.upsertMembership(membership)

      const input = ddbMock.commandCalls(UpdateCommand)[0].args[0].input
      expect(input.Key).toEqual({ PK: 'CHATUSER#user-1', SK: 'CHANNEL#seeker-1#req-1#donor-1' })
      expect(input.UpdateExpression).toContain('if_not_exists(#createdAt, :createdAt)')
    })

    test('listMembershipsByUser queries the user partition with the CHANNEL prefix', async() => {
      ddbMock.on(QueryCommand).resolves({
        Items: [
          { PK: 'CHATUSER#user-1', SK: 'CHANNEL#seeker-1#req-1#donor-1', role: ChatRole.SEEKER, createdAt: 'x' }
        ]
      })

      const memberships = await operations.listMembershipsByUser('user-1')

      const input = ddbMock.commandCalls(QueryCommand)[0].args[0].input
      expect(input.ExpressionAttributeValues?.[':pk']).toBe('CHATUSER#user-1')
      expect(input.ExpressionAttributeValues?.[':sk']).toBe('CHANNEL#')
      expect(memberships[0].channelId).toBe('seeker-1#req-1#donor-1')
    })

    test('updateLastRead sets only the caller\'s lastReadAt marker', async() => {
      ddbMock.on(UpdateCommand).resolves({})

      await operations.updateLastRead('user-1', 'seeker-1#req-1#donor-1', '2026-06-26T03:00:00.000Z')

      const input = ddbMock.commandCalls(UpdateCommand)[0].args[0].input
      expect(input.UpdateExpression).toBe('SET #lastReadAt = :lastReadAt')
      expect(input.Key).toEqual({ PK: 'CHATUSER#user-1', SK: 'CHANNEL#seeker-1#req-1#donor-1' })
    })

    test('updateMembershipLastMessage bumps the denormalized lastMessageAt', async() => {
      ddbMock.on(UpdateCommand).resolves({})

      await operations.updateMembershipLastMessage('user-1', 'seeker-1#req-1#donor-1', 'ts')

      const input = ddbMock.commandCalls(UpdateCommand)[0].args[0].input
      expect(input.UpdateExpression).toBe('SET #lastMessageAt = :lastMessageAt')
    })
  })

  describe('message operations', () => {
    const message: ChatMessageDTO = {
      channelId: 'seeker-1#req-1#donor-1',
      messageId: '2026-06-26T00:00:00.000Z#01',
      senderId: 'user-1',
      content: 'hello',
      createdAt: '2026-06-26T00:00:00.000Z'
    }

    test('putMessage stores under the channel message partition and returns the DTO', async() => {
      ddbMock.on(PutCommand).resolves({})

      const saved = await operations.putMessage(message)

      const input = ddbMock.commandCalls(PutCommand)[0].args[0].input
      expect((input.Item as { PK: string }).PK).toBe('CHATMSG#seeker-1#req-1#donor-1')
      expect(saved.content).toBe('hello')
    })

    test('queryMessages reads newest-first with the limit and cursor', async() => {
      ddbMock.on(QueryCommand).resolves({
        Items: [
          { PK: 'CHATMSG#seeker-1#req-1#donor-1', SK: 'm2', senderId: 'u', content: 'b', createdAt: 'x', ttl: 1 },
          { PK: 'CHATMSG#seeker-1#req-1#donor-1', SK: 'm1', senderId: 'u', content: 'a', createdAt: 'y', ttl: 1 }
        ],
        LastEvaluatedKey: { PK: 'CHATMSG#seeker-1#req-1#donor-1', SK: 'm1' }
      })

      const cursor = { PK: 'CHATMSG#seeker-1#req-1#donor-1', SK: 'm3' }
      const page = await operations.queryMessages('seeker-1#req-1#donor-1', 25, cursor)

      const input = ddbMock.commandCalls(QueryCommand)[0].args[0].input
      expect(input.ScanIndexForward).toBe(false)
      expect(input.Limit).toBe(25)
      expect(input.ExclusiveStartKey).toEqual(cursor)
      expect(page.items.map((m) => m.messageId)).toEqual(['m2', 'm1'])
      expect(page.lastEvaluatedKey).toEqual({ PK: 'CHATMSG#seeker-1#req-1#donor-1', SK: 'm1' })
    })
  })
})
