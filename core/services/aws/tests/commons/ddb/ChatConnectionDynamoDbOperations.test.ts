import ChatConnectionDynamoDbOperations from '../../../commons/ddbOperations/ChatConnectionDynamoDbOperations'
import {
  DynamoDBDocumentClient,
  PutCommand,
  DeleteCommand,
  QueryCommand
} from '@aws-sdk/lib-dynamodb'
import { mockClient } from 'aws-sdk-client-mock'
import type { ChatConnectionDTO } from '../../../../../../commons/dto/ChatDTO'

const TABLE = 'TestTable'
const REGION = 'ap-south-1'

describe('ChatConnectionDynamoDbOperations', () => {
  const ddbMock = mockClient(DynamoDBDocumentClient)
  const operations = new ChatConnectionDynamoDbOperations(TABLE, REGION)

  beforeEach(() => {
    ddbMock.reset()
  })

  test('put stores the connection keyed by connectionId with userId on GSI1', async() => {
    ddbMock.on(PutCommand).resolves({})
    const connection: ChatConnectionDTO = {
      connectionId: 'conn-1',
      userId: 'user-1',
      createdAt: '2026-06-26T00:00:00.000Z'
    }

    await operations.put(connection)

    const item = ddbMock.commandCalls(PutCommand)[0].args[0].input.Item as Record<string, string>
    expect(item.PK).toBe('CONNECTION#conn-1')
    expect(item.SK).toBe('CONNECTION#conn-1')
    expect(item.GSI1PK).toBe('CHATUSER#user-1')
  })

  test('deleteByConnectionId deletes using only the connectionId', async() => {
    ddbMock.on(DeleteCommand).resolves({})

    await operations.deleteByConnectionId('conn-1')

    const input = ddbMock.commandCalls(DeleteCommand)[0].args[0].input
    expect(input.Key).toEqual({ PK: 'CONNECTION#conn-1', SK: 'CONNECTION#conn-1' })
  })

  test('queryByUserId fans out over all of a user\'s connections via GSI1', async() => {
    ddbMock.on(QueryCommand).resolves({
      Items: [
        { PK: 'CONNECTION#conn-1', SK: 'CONNECTION#conn-1', GSI1PK: 'CHATUSER#user-1', GSI1SK: 'CONNECTION#conn-1', createdAt: 'x' },
        { PK: 'CONNECTION#conn-2', SK: 'CONNECTION#conn-2', GSI1PK: 'CHATUSER#user-1', GSI1SK: 'CONNECTION#conn-2', createdAt: 'y' }
      ]
    })

    const connections = await operations.queryByUserId('user-1')

    const input = ddbMock.commandCalls(QueryCommand)[0].args[0].input
    expect(input.IndexName).toBe('GSI1')
    expect(input.ExpressionAttributeValues?.[':pk']).toBe('CHATUSER#user-1')
    expect(connections.map((c) => c.connectionId)).toEqual(['conn-1', 'conn-2'])
  })
})
