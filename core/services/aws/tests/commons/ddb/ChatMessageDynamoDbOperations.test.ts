import {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
  TransactWriteCommand,
  UpdateCommand
} from '@aws-sdk/lib-dynamodb'
import { mockClient } from 'aws-sdk-client-mock'
import ChatMessageDynamoDbOperations from '../../../commons/ddbOperations/ChatMessageDynamoDbOperations'
import { ChatMessageModel } from '../../../commons/ddbModels/ChatMessageModel'
import type { ChatMessageDTO } from '../../../../../../commons/dto/ChatDTO'

const CHANNEL_ID = 'req-1#donor-1'

const message: ChatMessageDTO = {
  channelId: CHANNEL_ID,
  messageId: 'msg-1',
  clientMessageId: 'client-1',
  senderId: 'seeker-1',
  body: 'hello',
  sentAt: '2026-06-26T00:00:01.000Z',
  ttl: 1893456000
}

describe('ChatMessageDynamoDbOperations', () => {
  const ddbMock = mockClient(DynamoDBDocumentClient)
  const operations = new ChatMessageDynamoDbOperations('TestTable', 'ap-south-1')

  beforeEach(() => {
    ddbMock.reset()
  })

  describe('createMessageIdempotent', () => {
    it('writes the message and dedup guard atomically and reports created=true', async () => {
      ddbMock.on(TransactWriteCommand).resolves({})

      const result = await operations.createMessageIdempotent(message)

      expect(result.created).toBe(true)
      expect(result.message).toEqual(message)
      const transactCall = ddbMock.commandCalls(TransactWriteCommand)[0]
      expect(transactCall.args[0].input.TransactItems).toHaveLength(2)
    })

    it('returns the existing message when the dedup guard already exists (created=false)', async () => {
      const cancellation = new Error('transaction cancelled')
      cancellation.name = 'TransactionCanceledException'
      ddbMock.on(TransactWriteCommand).rejects(cancellation)

      ddbMock
        .on(GetCommand, {
          TableName: 'TestTable',
          Key: { PK: `CHAT_MSG#${CHANNEL_ID}`, SK: 'DEDUP#client-1' }
        })
        .resolves({ Item: { messageId: 'msg-1', sentAt: message.sentAt } })

      ddbMock
        .on(GetCommand, {
          TableName: 'TestTable',
          Key: { PK: `CHAT_MSG#${CHANNEL_ID}`, SK: `MSG#${message.sentAt}#msg-1` }
        })
        .resolves({ Item: new ChatMessageModel().fromDto(message) })

      const result = await operations.createMessageIdempotent(message)

      expect(result.created).toBe(false)
      expect(result.message).toEqual(message)
    })
  })

  describe('incrementRateCounter', () => {
    it('returns the updated counter value', async () => {
      ddbMock.on(UpdateCommand).resolves({ Attributes: { count: 3 } })
      const count = await operations.incrementRateCounter(CHANNEL_ID, 'seeker-1', '2026-06-26T00:00', 123)
      expect(count).toBe(3)
    })
  })

  describe('queryByChannel', () => {
    it('requests newest-first ordering and maps items', async () => {
      ddbMock.on(QueryCommand).resolves({
        Items: [new ChatMessageModel().fromDto(message)],
        LastEvaluatedKey: undefined
      })

      const result = await operations.queryByChannel(CHANNEL_ID, 20)

      expect(result.items).toEqual([message])
      const queryCall = ddbMock.commandCalls(QueryCommand)[0]
      expect(queryCall.args[0].input.ScanIndexForward).toBe(false)
      expect(queryCall.args[0].input.Limit).toBe(20)
    })
  })
})
