import WsConnectionDynamoDbOperations from '../../commons/ddbOperations/WsConnectionDynamoDbOperations'
import {
  DynamoDBDocumentClient,
  DeleteCommand,
  PutCommand,
  QueryCommand
} from '@aws-sdk/lib-dynamodb'
import { mockClient } from 'aws-sdk-client-mock'
import type { WsConnectionDTO } from '../../commons/ddbModels/WsConnectionModel'

const TABLE = 'TestTable'
const REGION = 'ap-south-1'

const connection: WsConnectionDTO = { userId: 'donor1', connectionId: 'conn-1' }

describe('WsConnectionDynamoDbOperations', () => {
  const ddbMock = mockClient(DynamoDBDocumentClient)
  const ops = new WsConnectionDynamoDbOperations(TABLE, REGION)

  beforeEach(() => {
    ddbMock.reset()
  })

  test('putConnection persists the connection mapping', async() => {
    ddbMock.on(PutCommand).resolves({ $metadata: { httpStatusCode: 200 } })

    const result = await ops.putConnection(connection)

    expect(result.userId).toBe('donor1')
    expect(result.connectionId).toBe('conn-1')
    const input = ddbMock.commandCalls(PutCommand)[0].args[0].input
    expect(input.Item?.PK).toBe('WSCONN#donor1')
    expect(input.Item?.SK).toBe('conn-1')
  })

  test('deleteConnection removes the mapping by user and connection id', async() => {
    ddbMock.on(DeleteCommand).resolves({ $metadata: { httpStatusCode: 200 } })

    await ops.deleteConnection('donor1', 'conn-1')

    const input = ddbMock.commandCalls(DeleteCommand)[0].args[0].input
    expect(input.Key).toEqual({ PK: 'WSCONN#donor1', SK: 'conn-1' })
  })

  test('getConnectionsForUser returns every live connection for the user', async() => {
    ddbMock.on(QueryCommand).resolves({
      Items: [
        { PK: 'WSCONN#donor1', SK: 'conn-1', expiresAt: 1790000000 },
        { PK: 'WSCONN#donor1', SK: 'conn-2', expiresAt: 1790000000 }
      ]
    })

    const result = await ops.getConnectionsForUser('donor1')

    expect(result).toHaveLength(2)
    expect(result.map((connectionRow) => connectionRow.connectionId)).toEqual(['conn-1', 'conn-2'])
  })

  test('getConnectionsForUser returns an empty list when none are live', async() => {
    ddbMock.on(QueryCommand).resolves({ Items: [] })

    const result = await ops.getConnectionsForUser('donor1')

    expect(result).toEqual([])
  })
})
